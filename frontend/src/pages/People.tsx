import { Fragment, useState } from "react";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import type { AttendanceSummary, User } from "../types";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { ProgressBar, attendanceTone } from "../components/ui/ProgressBar";
import { ErrorState, LoadingState } from "../components/ui/States";
import { EmptyState } from "../components/ui/EmptyState";

export function People({ role, title }: { role: "student" | "faculty"; title: string }) {
  const people = useApi(() => api.get<User[]>(`/users?role=${role}`), [role]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const summary = useApi<AttendanceSummary | null>(
    () =>
      selectedId
        ? api.get<AttendanceSummary>(`/attendance/summary?student=${selectedId}`)
        : Promise.resolve(null),
    [selectedId]
  );

  if (people.loading) return <LoadingState label={`Loading ${title.toLowerCase()}...`} />;
  if (people.error) return <ErrorState message={people.error} onRetry={people.reload} />;
  if (!people.data?.length) {
    return <EmptyState title={`No ${title.toLowerCase()} yet.`} description="Seed the database to load demo people." />;
  }

  const search = query.trim().toLowerCase();
const list = people.data.filter(
  (person) =>
    !search ||
    person.name.toLowerCase().includes(search) ||
    person.email.toLowerCase().includes(search)
);
  const canInspect = role === "student";

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        action={
          <Input
            type="search"
            aria-label={`Search ${title.toLowerCase()}`}
            placeholder={`Search ${title.toLowerCase()}…`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="sm:w-64"
          />
        }
      />

      {list.length ? (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {list.map((person) => (
                <Fragment key={person._id}>
                  <tr className="border-b border-line">
                    <td className="px-4 py-3">
                      {canInspect ? (
                        <button
                          type="button"
                          onClick={() => setSelectedId((current) => (current === person._id ? null : person._id))}
                          className="text-left font-medium text-primary hover:underline"
                          aria-expanded={selectedId === person._id}
                        >
                          {person.name}
                        </button>
                      ) : (
                        person.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{person.email}</td>
                  </tr>
                  {canInspect && selectedId === person._id ? (
                    <tr className="border-b border-line last:border-0">
                      <td className="px-4 py-4" colSpan={2}>
                        {summary.loading ? (
                          <p className="text-sm text-muted">Loading attendance summary…</p>
                        ) : summary.error ? (
                          <p className="text-sm text-danger">{summary.error}</p>
                        ) : !summary.data?.bySubject.length ? (
                          <p className="text-sm text-muted">No attendance records yet for this student.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              Overall attendance: {summary.data.overall}% · {summary.data.attended} of{" "}
                              {summary.data.total} sessions
                            </p>
                            {summary.data.bySubject.map((item) => (
                              <ProgressBar
                                key={item.subject._id}
                                value={item.percent}
                                label={item.subject.name}
                                tone={attendanceTone(item.percent)}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyState
            title={`No matches for "${query}"`}
            description={`Try a different name or email to find a ${title.toLowerCase().replace(/s$/, "")}.`}
          />
        </div>
      )}
    </div>
  );
}

export function AdminSubjects() {
  const subjects = useApi(() => api.get<import("../types").Subject[]>("/subjects"), []);
  if (subjects.loading) return <LoadingState label="Loading subjects..." />;
  if (subjects.error) return <ErrorState message={subjects.error} onRetry={subjects.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Subjects" />
      <div className="grid gap-3">
        {subjects.data?.map((subject) => (
          <Card key={subject._id}>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{subject.code}</p>
            <p className="mt-1 font-medium">{subject.name}</p>
            <p className="text-sm text-muted">
              {typeof subject.faculty === "object" ? subject.faculty.name : "Faculty assigned"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminClasses() {
  const classes = useApi(() => api.get<import("../types").ClassSession[]>("/classes"), []);
  if (classes.loading) return <LoadingState label="Loading classes..." />;
  if (classes.error) return <ErrorState message={classes.error} onRetry={classes.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Classes" />
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Faculty</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Schedule</th>
            </tr>
          </thead>
          <tbody>
            {classes.data?.map((item) => (
              <tr key={item._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{item.subject.name}</td>
                <td className="px-4 py-3">{item.faculty.name}</td>
                <td className="px-4 py-3">{item.section}</td>
                <td className="px-4 py-3">{item.room}</td>
                <td className="px-4 py-3">
                  {item.schedule.days.join(", ")} · {item.schedule.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
