"use client"

import { RiAddLine, RiDeleteBinLine, RiEditLine, RiFingerprintLine } from "@remixicon/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { authClient } from "@/lib/auth/client"
import { passkeyLabel } from "@/lib/passkey/aaguids"

type Passkey = {
  id: string
  name?: string | null
  aaguid?: string | null
  backedUp: boolean
  createdAt: string | Date
}

const QUERY_KEY = ["passkeys"]

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function Passkeys() {
  const queryClient = useQueryClient()
  const [renaming, setRenaming] = useState<Passkey | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deleting, setDeleting] = useState<Passkey | null>(null)
  const [adding, setAdding] = useState(false)

  const { data, isPending, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await authClient.passkey.listUserPasskeys()
      if (res.error) throw new Error(res.error.message)
      return (res.data ?? []) as Passkey[]
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await authClient.passkey.updatePasskey({ id, name })
      if (res.error) throw new Error(res.error.message)
    },
    onSuccess: () => {
      setRenaming(null)
      void invalidate()
    },
    onError: (e: Error) => toast.add({ title: e.message || "Could not rename", type: "error" }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await authClient.passkey.deletePasskey({ id })
      if (res.error) throw new Error(res.error.message)
    },
    onSuccess: () => {
      setDeleting(null)
      void invalidate()
    },
    onError: (e: Error) => toast.add({ title: e.message || "Could not remove", type: "error" }),
  })

  const onAdd = async () => {
    setAdding(true)
    // addPasskey resolves undefined on success and only returns an object carrying `error`.
    const res = await authClient.passkey.addPasskey()
    setAdding(false)
    if (res?.error) {
      // Dismissing the system sheet surfaces as NotAllowedError/AbortError: a change of mind, not
      // a failure, so it gets no toast.
      const name = (res.error as { name?: string }).name
      if (name !== "NotAllowedError" && name !== "AbortError") {
        toast.add({ title: res.error.message || "Could not add a passkey", type: "error" })
      }
      return
    }
    toast.add({ title: "Passkey added.", type: "success" })
    void invalidate()
  }

  const passkeys = data ?? []
  // Deleting the only passkey is recoverable (magic link still works) but not obviously so from
  // here, so the confirmation says it out loud rather than leaving someone to guess.
  const isLast = passkeys.length === 1

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={onAdd} disabled={adding}>
          {adding ? <Spinner /> : <RiAddLine />}
          Add a passkey
        </Button>
      </div>

      {isPending ? (
        <div className="text-muted-foreground flex justify-center py-8">
          <Spinner />
        </div>
      ) : isError ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Could not load your passkeys. Refresh to try again.
        </p>
      ) : passkeys.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiFingerprintLine />
            </EmptyMedia>
            <EmptyTitle>No passkeys yet</EmptyTitle>
            <EmptyDescription>
              Add one to sign in with Touch ID, Windows Hello or a security key instead of a link in
              your inbox.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup>
          {passkeys.map((passkey) => (
            <Item key={passkey.id} variant="outline">
              <ItemMedia variant="icon">
                <RiFingerprintLine />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{passkeyLabel(passkey.name, passkey.aaguid)}</ItemTitle>
                <ItemDescription>
                  Added {formatDate(passkey.createdAt)}
                  {!passkey.backedUp && " · on this device only, so it is lost with the device"}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Rename ${passkeyLabel(passkey.name, passkey.aaguid)}`}
                  onClick={() => {
                    setRenaming(passkey)
                    setRenameValue(passkey.name ?? "")
                  }}
                >
                  <RiEditLine />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${passkeyLabel(passkey.name, passkey.aaguid)}`}
                  onClick={() => setDeleting(passkey)}
                >
                  <RiDeleteBinLine />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename passkey</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="MacBook Touch ID"
            aria-label="Passkey name"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={rename.isPending || renameValue.trim().length === 0}
              onClick={() =>
                renaming && rename.mutate({ id: renaming.id, name: renameValue.trim() })
              }
            >
              {rename.isPending ? <Spinner /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {deleting ? passkeyLabel(deleting.name, deleting.aaguid) : "this passkey"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The passkey stays on your device until you delete it there too, but it will no longer
              sign you in here.
              {isLast && " This is your last one, so you will be back to signing in by email."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              {remove.isPending ? <Spinner /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
