"use client"

import { site } from "@packages/config/site"
import { RiFingerprintLine, RiGithubFill, RiGoogleFill, RiLayoutGridFill } from "@remixicon/react"
import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { apiClient, unwrap } from "@/lib/api/client"
import { authClient } from "@/lib/auth/client"
import { config } from "@/lib/config"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }),
})

// The one sign-in dialog the whole app uses. The trigger is parameterised rather
// than duplicated: the navbar wants a 24-unit outline button reading Login, the
// landing hero wants a wide primary call to action, and both must open exactly
// this dialog.
export function Access({
  className,
  label = "Login",
  labelClassName,
  size,
  variant = "outline",
}: {
  className?: string
  label?: string
  labelClassName?: string
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const pathname = usePathname()
  const [loader, setLoader] = useState<"email" | "github" | "google" | "passkey" | null>(null)
  const [open, setOpen] = useState(false)
  // WebAuthn needs both a secure context and the platform API. A button that opens nothing is worse
  // than no button, so this stays false until the browser confirms both. It is set in an effect
  // rather than inline so the server render and the first client render agree.
  const [passkeySupported, setPasskeySupported] = useState(false)
  // Next inlines NODE_ENV at build time: "development" only under `next dev`,
  // "production" for any `next build`. Auto-hides in deployments.
  const isDev = process.env.NODE_ENV === "development"

  // Render only the sign-in providers the API reports as enabled (GET /api/auth/providers); deploy-static so cached for the session and prefetched on mount, so the dialog (whose content mounts on open) paints the final state with no flash.
  const { data, isError, isPending } = useQuery({
    queryKey: ["auth-providers"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await unwrap(apiClient.auth.providers.$get())
      if (error) throw new Error(error.message)
      return data
    },
  })
  // The extra isDev keeps this dev-only admin control out of any production bundle.
  const agentEnabled = isDev && (data?.providers.includes("agent") ?? false)
  const githubEnabled = data?.providers.includes("github") ?? false
  const googleEnabled = data?.providers.includes("google") ?? false
  const magicLinkEnabled = data?.providers.includes("magic-link") ?? false
  // Two gates: the API must offer it, and this browser must be able to run the ceremony.
  const passkeyEnabled = (data?.providers.includes("passkey") ?? false) && passkeySupported
  const hasAlternatives = agentEnabled || githubEnabled || googleEnabled || passkeyEnabled
  const hasNoProviders = !magicLinkEnabled && !hasAlternatives

  useEffect(() => {
    setLoader(null)
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    setPasskeySupported(window.isSecureContext && typeof window.PublicKeyCredential !== "undefined")
  }, [])

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: formSchema,
      onChange: formSchema,
      onBlur: formSchema,
    },
    onSubmit: async ({ value }) => {
      setLoader("email")
      const res = await authClient.signIn.magicLink({
        email: value.email,
        callbackURL: `${config.app.url}/dashboard`,
      })
      if (res.error) {
        toast.add({ title: res.error.message || "Provider Not Found", type: "error" })
        setLoader(null)
      } else {
        toast.add({ title: "Check your email for the magic link!", type: "success" })
        setLoader(null)
      }
      form.reset()
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className={cn("w-24", className)} size={size} variant={variant} />}
      >
        <span className={labelClassName}>{label}</span>
      </DialogTrigger>
      <DialogContent className="max-w-md" initialFocus={false}>
        <DialogHeader className="sr-only">
          <DialogTitle className="text-center">Sign in/up</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md">
                <RiLayoutGridFill className="size-6" />
              </div>
              <span className="sr-only">{site.name}</span>
            </div>
            <h1 className="text-xl font-semibold">Welcome to {site.name}</h1>
          </div>
          {magicLinkEnabled && (
            <form
              id="email"
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              <FieldGroup>
                <form.Field name="email">
                  {(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          id={field.name}
                          type="email"
                          name={field.name}
                          className="focus:placeholder:opacity-0"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="you@example.com"
                          disabled={loader === "email"}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                </form.Field>
              </FieldGroup>
              <Button
                form="email"
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={loader === "email"}
              >
                {loader === "email" ? <Spinner /> : null}
                Sign in/up
              </Button>
            </form>
          )}
          {magicLinkEnabled && hasAlternatives && (
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-popover text-muted-foreground relative z-10 px-2 text-xs">
                OR
              </span>
            </div>
          )}
          {hasAlternatives && (
            <div className="grid gap-4">
              {agentEnabled && (
                <form action={`${config.api.url}/api/agents/sign-in-as`} method="POST">
                  <Button type="submit" variant="outline" className="w-full">
                    Login (agents)
                  </Button>
                </form>
              )}
              {passkeyEnabled && (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={async () => {
                    setLoader("passkey")
                    // Unlike social sign-in there is no provider redirect: the ceremony completes in
                    // place and only sets a cookie, so navigate manually. A hard navigation rather
                    // than router.push so the server components re-read the new session.
                    const res = await authClient.signIn.passkey({
                      fetchOptions: {
                        onSuccess: () => {
                          window.location.href = `${config.app.url}/dashboard`
                        },
                      },
                    })
                    if (res?.error) {
                      // Dismissing the system sheet surfaces as NotAllowedError/AbortError. That is
                      // the user changing their mind, not a failure, so it gets no toast.
                      const name = (res.error as { name?: string }).name
                      if (name !== "NotAllowedError" && name !== "AbortError") {
                        toast.add({
                          title: res.error.message || "Could not sign in with a passkey",
                          type: "error",
                        })
                      }
                      setLoader(null)
                    }
                  }}
                  disabled={loader === "passkey"}
                >
                  {loader === "passkey" ? <Spinner /> : <RiFingerprintLine className="size-5" />}
                  Sign in with a passkey
                </Button>
              )}
              {githubEnabled && (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={async () => {
                    setLoader("github")
                    const res = await authClient.signIn.social({
                      provider: "github",
                      callbackURL: `${config.app.url}/dashboard`,
                    })
                    if (res.error) {
                      toast.add({
                        title: res.error.message || "Could not sign in with GitHub",
                        type: "error",
                      })
                      setLoader(null)
                    }
                  }}
                  disabled={loader === "github"}
                >
                  {loader === "github" ? <Spinner /> : <RiGithubFill className="size-5" />}
                  Continue with GitHub
                </Button>
              )}
              {googleEnabled && (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={async () => {
                    setLoader("google")
                    const res = await authClient.signIn.social({
                      provider: "google",
                      callbackURL: `${config.app.url}/dashboard`,
                    })
                    if (res.error) {
                      toast.add({
                        title: res.error.message || "Could not sign in with Google",
                        type: "error",
                      })
                      setLoader(null)
                    }
                  }}
                  disabled={loader === "google"}
                >
                  {loader === "google" ? <Spinner /> : <RiGoogleFill className="size-5" />}
                  Continue with Google
                </Button>
              )}
              <div className="text-muted-foreground text-center text-xs text-balance">
                By clicking continue, you agree to our Terms of Service and Privacy Policy.
              </div>
            </div>
          )}
          {hasNoProviders &&
            (isPending ? (
              <div className="text-muted-foreground flex justify-center">
                <Spinner className="size-5" />
              </div>
            ) : isError ? (
              <p className="text-muted-foreground text-center text-sm">
                Could not load sign-in options. Refresh to try again.
              </p>
            ) : (
              <p className="text-muted-foreground text-center text-sm">
                No sign-in options are configured yet.
                {isDev && " Set AGENT_SIGNIN_ENABLED=true in .env to enable local agent login."}
              </p>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
