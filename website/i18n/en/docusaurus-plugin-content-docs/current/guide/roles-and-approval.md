# How to use roles and SQL approval

When a team edits the model together, you need who may change schema and who may apply SQL. This guide covers **save version → submit ticket → approve**.

> **Goal**: Constrain model edits with project roles; gate applied SQL with approval.  
> **Prereq**: A signed-in team (or personal) project; two+ members make the approval path clearer.  
> **Boundary**: **Project-level** access—not a full enterprise IAM / SSO replacement. Details: [Security model](/docs/security-model).

## Roles (typical split)

| Role tendency | Typical actions |
|---|---|
| Member | Edit model, propose changes |
| Approver / owner | Review SQL, approve or reject |
| Admin | Members, datasources, etc. |

Exact menu labels follow the current UI.

## Steps (main approval path)

1. Finish structural edits and [Save a version](./save-version-and-diff.md).  
2. In **Version management**, on that version row, **Submit ticket** (SQL approval).  
3. Pick an approver and submit.  
4. Approver opens **Pending / tickets**, reviews SQL.  
5. **Approve** or **Reject** (destructive actions ask for confirmation).

## What success looks like

- A pending record appears; approvers can open the SQL body.  
- After **Approve**, status follows product rules; execution failure is **not** disguised as approved.  
- After reject/cancel, the submitter sees the outcome and can revise.

## Troubleshooting

| Symptom | Try |
|---|---|
| Can’t find approval entry | Check role; look for **Submit ticket** on the version row; top-bar pending/tickets |
| Personal project, no approval needed | Fine—use version diffs only |
| Collaborators don’t see each other’s cursors | Self-host: ensure collab ports are reachable; see [Deployment](/docs/deployment) |
| Want company SSO | Default is in-product accounts; federation depends on instance config / eng docs |

## Next

- [Save a version and view the diff](./save-version-and-diff.md)  
- [Quick self-host](./quick-self-host.md)  
- [Start here](./intro.md)
