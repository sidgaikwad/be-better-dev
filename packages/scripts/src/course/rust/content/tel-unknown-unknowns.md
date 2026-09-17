The newsletter service can now take subscriptions. `POST /subscriptions` parses the form and inserts a row, and two black-box tests pin down the basics: valid data gets a 200 and a row in Postgres, missing fields get a 400. Ready to deploy? The book's answer is no. The application is not instrumented and collects no telemetry data, which leaves us exposed to the failures we have not imagined yet.

## Tests check the questions you thought to ask

A green suite is evidence, not proof. Tests verify the scenarios you thought to encode; production specialises in the rest. Some blind spots in our small app we can already name: if the connection to Postgres drops, does `sqlx::PgPool` recover on its own, or does every later query fail until a restart? What happens when someone posts a hostile payload, a giant body, an SQL injection attempt? These are known unknowns: we know the question and have simply not investigated. Given time, we could work down the list.

The dangerous class is the unknown unknowns: failure modes we have not imagined, so there is no test, no dashboard, no runbook. Experience converts a few into known unknowns (after you watch one database failover strand a transaction, you never forget to ask), but most are peculiar to the specific system. They live at the crossroads of your code, the operating system, the hardware, your deployment process, and the outside world. Typical triggers: the system is pushed outside its usual operating conditions by a traffic spike; several components fail at the same time; a small change moves the system's equilibrium, like tuning a retry policy; or nothing changes for weeks and a slow memory leak finally lands. What they share: they are usually impossible to reproduce outside the live environment.

## Observability

Assume you will not be there when it happens. It is late at night, or you are deep in something else. Attaching a debugger to a production process is rarely possible or wise, assuming you even know which process to look at; the degradation might affect several systems at once. The one thing you can arrange to have is telemetry data: information about the running application, collected automatically, that can be inspected later to answer questions about the state of the system.

Later is the load-bearing word. For an unknown unknown you do not know the question in advance; that is what makes it one. So the goal is an observable application: one you can ask questions of after the fact without having decided up front what you would ask. Taken literally, "arbitrary questions" is an unbounded budget. In practice we settle for sufficiently observable: enough to deliver the level of service we promised users. Two ingredients get us there: instrument the application to collect high-quality telemetry data, and have tools to slice and search it. This chapter is about the first.

## Telemetry is written months before it is read

The log record that rescues an incident is designed at review time, long before, by someone who could not know the incident was coming. When the page fires, the responder's questions are concrete: which endpoint, which inputs, since when, what did the database say. Whether those questions are answerable was settled in code, months earlier. "We will debug it when it breaks" fails because the debugging data cannot be collected retroactively. A request that was not recorded is gone.

## Predict, then verify

Run the app as it stands at the end of the previous section with `cargo run`, then hit it with `curl -v http://127.0.0.1:8000/health_check`. The request returns `200 OK`. What appears in the terminal running the application?

Answer: nothing. The request succeeds and the process stays silent, which is the problem in miniature: nothing we wrote records that a request happened at all. actix-web and its dependencies do emit log records internally, but nothing is installed to receive them, so they are discarded. Making sense of that sentence, who emits, who receives, and why those are separate jobs, is the next lesson.
