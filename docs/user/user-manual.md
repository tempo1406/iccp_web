# CAPSTONE PROJECT REPORT

## Report 6 - Software User Guides

## I. Record of Changes
| Version | Date | Description | Author |
| --- | --- | --- | --- |
| 1.0 | 2026-04-20 | Initial user manual for ICCP Web | Codex |

## II. Release Package & User Guides

### 1. Deliverable Package
- ICCP Web frontend application
- Source code repository
- User manual

### 2. User Manual (Website URL - ICCP Web deployment link)

#### 2.1 Guest
The Guest role includes users who are not logged in yet. Guests can access public entry pages, register an account, verify email, log in, reset a password, and accept invitation links.

##### Accessing the Website (Route: `/`)
**Preconditions**
1. A web browser is installed.
2. Internet connection is available.

**User Interface**
- Landing page
- Header navigation
- Register and Login actions

**Steps**
1. Open the browser.
2. Enter the ICCP website URL.
3. Press `Enter`.
4. Wait until the landing page loads.
5. Confirm that the header and public sections are visible.

**Expected Result**
1. The website loads without authentication.
2. The user can continue to registration or login.

##### Register Account (Route: `/register`)
**Preconditions**
1. The user is not logged in.
2. The user has a valid email address.

**User Interface**
- Registration form
- Full Name field
- Work Email field
- Password field
- Confirm Password field

**Steps**
1. Open `/register`.
2. Enter `Full Name`.
3. Enter `Work Email`.
4. Enter `Password`.
5. Enter `Confirm Password`.
6. Review all fields.
7. Click `Create Account`.

**Expected Result**
1. The account is created successfully.
2. The user is redirected to the email verification flow if verification is required.

##### Verify Email (Route: `/verify-email`)
**Preconditions**
1. The user has completed registration.
2. The verification code has been received.

**User Interface**
- Verification form
- Verification code input
- Verify button
- Resend code action

**Steps**
1. Open `/verify-email`.
2. Confirm the correct email is shown.
3. Enter the verification code.
4. Click `Verify`.
5. If the code expires, click `Resend`.
6. Enter the new code and submit again.

**Expected Result**
1. The email is verified successfully.
2. The user can proceed to authenticated routes.

##### Login (Route: `/login`)
**Preconditions**
1. The user already has an account.

**User Interface**
- Login form
- Work Email field
- Password field
- Forgot Password link

**Steps**
1. Open `/login`.
2. Enter `Work Email`.
3. Enter `Password`.
4. Click `Sign In`.

**Expected Result**
1. The user enters an authenticated session.
2. The user is redirected to workspace selection or the next valid route.

##### Forgot Password (Route: `/forgot-password`)
**Preconditions**
1. The user cannot access the current password.
2. The account email is still accessible.

**User Interface**
- Forgot password form
- Email input
- Submit action

**Steps**
1. Open `/forgot-password`.
2. Enter the registered email address.
3. Click `Submit`.
4. Check the mailbox for reset instructions.
5. Complete the reset flow.
6. Return to `/login`.
7. Sign in with the new password.

**Expected Result**
1. The user regains account access.
2. The new password is accepted in the login form.

##### Accept Invitation (Routes: `/invite/accept`, `/project-invites/accept`)
**Preconditions**
1. The user has a valid invitation link.

**User Interface**
- Invitation acceptance page
- Invitation summary
- Accept action

**Steps**
1. Open the invitation link.
2. Review the invitation details.
3. Sign in if required.
4. Click `Accept`.

**Expected Result**
1. The invitation is accepted successfully.
2. The user is redirected to the related organization or project flow.

#### 2.2 Workspace User (Authenticated User)
The Workspace User role includes authenticated employees who work inside an organization workspace. Users can manage documents, use the AI chatbot, communicate in team chat, submit tickets, and maintain personal profile data.

##### Workspace Access Rules
1. The user must be authenticated.
2. The email should be verified.
3. The user must be a member of at least one organization to open a tenant workspace.

##### Select Workspace (Route: `/dashboard`)
**Preconditions**
1. The user is logged in.
2. The user belongs to one or more organizations, or can create one.

**User Interface**
- Workspace list or grid
- `Open Workspace` action
- `Create Organization` action

**Steps**
1. Open `/dashboard`.
2. Review the available organizations.
3. Click `Open Workspace` on the target organization.
4. If no organization exists, click `Create Organization`.

**Expected Result**
1. The selected workspace is opened.
2. The user is redirected to the tenant dashboard.

##### Create Organization (Route: `/dashboard/create`)
**Preconditions**
1. The user is logged in.

**User Interface**
- Organization creation form
- Logo uploader
- Organization details section

**Steps**
1. Open `/dashboard/create`.
2. Enter `Organization Name`.
3. Enter `URL Slug`.
4. Enter `Industry`, `Organization Size`, and `Description`.
5. Upload a logo if needed.
6. Click `Create Organization`.

**Expected Result**
1. A new organization workspace is created.
2. The user becomes the initial workspace owner/admin.

##### Workspace Dashboard (Route: `/tenant/[tenant]/dashboard`)
**Preconditions**
1. The user is logged in.
2. A valid workspace has been selected.

**User Interface**
- Sidebar navigation
- Quick action cards
- Recent activity
- Pending tasks

**Steps**
1. Open the tenant dashboard.
2. Review workspace summary cards.
3. Check recent activity.
4. Check pending tasks.
5. Use quick actions to navigate to major modules.

**Expected Result**
1. The user understands the current workspace status.
2. The user can move to documents, chatbot, or team chat directly.

##### Documents (Route: `/tenant/[tenant]/documents`)
**Preconditions**
1. The user is logged in.
2. The account has permission to list documents.

**User Interface**
- Document sidebar
- Folder mode / Category mode switch
- Search bar
- Grid / list view
- Upload dialog

**Steps**
1. Open the `Documents` page.
2. Choose `Folder mode` or `Category mode`.
3. Select a folder or category.
4. Search for a document if needed.
5. Open a document from the grid or list.
6. If permission is available, click `Upload` to add a new document.

**Expected Result**
1. The user can browse and open documents.
2. Authorized users can upload and organize files.

##### AI Chatbot (Route: `/tenant/[tenant]/chatbot`)
**Preconditions**
1. The user is logged in.
2. The account can use chatbot features.

**User Interface**
- Conversation sidebar
- Message list
- Input bar
- Search mode selector

**Steps**
1. Open `Chatbot`.
2. Create a new conversation or open an existing one.
3. Select `Document search`, `Web search`, or `Hybrid`.
4. Type a question.
5. Press `Enter` or click `Send`.
6. Review the answer.
7. Continue with follow-up questions.

**Expected Result**
1. The system returns an AI response.
2. The conversation history is saved in the sidebar.

##### Team Chat (Route: `/tenant/[tenant]/team-chat`)
**Preconditions**
1. The user is logged in.

**User Interface**
- Chat sidebar
- Scope filter
- Channel list
- Group chat list
- Direct messages
- Composer area

**Steps**
1. Open `Team Chat`.
2. Select organization scope or project scope.
3. Open a channel, group chat, or direct message.
4. Type a message.
5. Attach files if needed.
6. Send the message.
7. Review tabs such as `Files`, `Photos`, or `Pins`.

**Expected Result**
1. Messages are delivered to the target conversation.
2. The user can continue collaboration in real time.

##### Ticket Center (Route: `/tenant/[tenant]/ticket`)
**Preconditions**
1. The user is logged in.
2. The account has permission to create or view tickets.

**User Interface**
- Ticket dashboard cards
- `My Tickets` / `All Tickets`
- `New Request`
- `New OT Request`

**Steps**
1. Open `Ticket`.
2. Switch between `My Tickets` and `All Tickets` if available.
3. Click `New Request` or `New OT Request`.
4. Fill in the request form.
5. Submit the request.
6. Return to the list and monitor ticket status.

**Expected Result**
1. The request is created successfully.
2. The ticket appears in the ticket list with the correct status.

##### My Daily Report (Route: `/tenant/[tenant]/analytics/daily-reports`)
**Preconditions**
1. The user is logged in.
2. The user belongs to at least one project.

**User Interface**
- Project selector
- Date selector
- Daily summary card
- Report items list
- `Refresh from worklogs`
- `Save draft`
- `Submit`

**Steps**
1. Open `My Daily Report`.
2. Select a project.
3. Select the report date.
4. Click `Refresh from worklogs` if needed.
5. Update `Summary`, `Blockers`, and `Plan tomorrow`.
6. Click `Save draft` or `Submit`.

**Expected Result**
1. The daily report is updated successfully.
2. Submitted reports become available for team review.

##### Profile (Route: `/tenant/[tenant]/profile`)
**Preconditions**
1. The user is logged in.

**User Interface**
- Profile overview sidebar
- Personal information card
- Notification settings card

**Steps**
1. Open `Profile`.
2. Review the current profile information.
3. Update personal information if required.
4. Review notification settings.

**Expected Result**
1. The profile data is updated successfully.
2. The account remains accessible with the new settings.

#### 2.3 Organization Admin / Owner
The Organization Admin / Owner role manages workspace structure, members, permissions, organization settings, public landing pages, billing, and organization-wide analytics.

##### Invite Members (Route: `/tenant/[tenant]/organization-management/invite-members`)
**Preconditions**
1. The user is logged in.
2. The account can manage invitations.

**User Interface**
- Invitation form
- Email tag area
- Invitation note editor
- Invitation registry table

**Steps**
1. Open `Organization Management > Invite Members`.
2. Enter one or more email addresses.
3. Add an optional invitation note.
4. Click `Send Invitation`.
5. Review invitation status in the registry.
6. Resend or cancel invitations when needed.

**Expected Result**
1. Invitations are created successfully.
2. Pending, accepted, and attention-required invitations are visible in the registry.

##### Members Management (Route: `/tenant/[tenant]/organization-management/members`)
**Preconditions**
1. The user is logged in.
2. The account can list members.

**User Interface**
- Search field
- Status filter
- Members table
- Member details dialog
- Remove member dialog

**Steps**
1. Open `Organization Management > Members`.
2. Search by name, email, or user ID.
3. Filter by status.
4. Open member details.
5. Activate, deactivate, or remove a member if your role allows it.

**Expected Result**
1. Member data can be reviewed from one place.
2. Authorized changes are saved correctly.

##### Roles & Permissions (Route: `/tenant/[tenant]/organization-management/roles-permissions`)
**Preconditions**
1. The user is logged in.
2. The account can view or manage RBAC settings.

**User Interface**
- Role registry
- New role form
- Role details dialog
- Role edit dialog
- Member role assignment section

**Steps**
1. Open `Organization Management > Roles & Permissions`.
2. Create a new custom role if needed.
3. Open a role to review permissions.
4. Edit the role and assign or revoke permissions.
5. Select a member and assign one or more roles.

**Expected Result**
1. Organization roles are updated successfully.
2. Member-role assignments reflect the latest configuration.

##### Organization Profile & Branding (Route: `/tenant/[tenant]/organization-management/profile`)
**Preconditions**
1. The user is logged in.
2. The account can edit organization profile data.

**User Interface**
- General tab
- Branding tab
- Branding preview

**Steps**
1. Open `Organization Management > Profile`.
2. Update general organization information.
3. Open the `Branding` tab.
4. Update chatbot branding values such as bot name, persona, or brand color.
5. Save the changes.

**Expected Result**
1. Organization profile data is updated.
2. Branding preview reflects the new settings.

##### Organization Settings (Route: `/tenant/[tenant]/organization-management/settings`)
**Preconditions**
1. The user is logged in.
2. The account can view organization settings.

**User Interface**
- KPI weight section
- Overtime multiplier section
- KPI digest schedule section
- Bonus rules section

**Steps**
1. Open `Organization Management > Settings`.
2. Review KPI weights.
3. Update overtime multipliers if needed.
4. Configure KPI digest schedule.
5. Update bonus rules.
6. Click `Save Changes`.

**Expected Result**
1. Organization performance settings are saved successfully.
2. Future KPI calculations use the updated values.

##### Working Time (Route: `/tenant/[tenant]/organization-management/working-time`)
**Preconditions**
1. The user is logged in.
2. The account can view working time settings.

**User Interface**
- Weekly working hours grid
- Edit mode
- Save and Cancel actions

**Steps**
1. Open `Organization Management > Working Time`.
2. Click `Edit Settings`.
3. Update standard hours for each day.
4. Click `Save Changes`.

**Expected Result**
1. Standard working hours are updated successfully.
2. KPI and overtime logic use the latest schedule.

##### Organization KPI and Periodic Reports (Routes: `/tenant/[tenant]/analytics/kpi`, `/tenant/[tenant]/analytics/periodic-reports`)
**Preconditions**
1. The user is logged in.
2. The account has KPI or report permissions.

**User Interface**
- KPI overview
- KPI Targets manager
- Periodic report filters
- Report history table
- Dispatch dialog

**Steps**
1. Open `Analytics > KPI`.
2. Review organization KPI overview.
3. Open `KPI Targets`.
4. Assign, update, clone, or remove KPI targets if allowed.
5. Open `Analytics > Periodic Reports`.
6. Filter report history.
7. Dispatch a periodic report manually if your role allows it.

**Expected Result**
1. KPI targets are managed successfully.
2. Periodic report history and manual dispatch actions are available.

##### Site Studio (Route: `/tenant/[tenant]/organization-management/landing-page`)
**Preconditions**
1. The user is logged in.
2. The account can manage the organization landing page.

**User Interface**
- Page library
- Starter templates
- `New Page`
- `View Live`
- `Public URL`

**Steps**
1. Open `Site Studio`.
2. Create a blank page or choose a starter template.
3. Open the page editor.
4. Edit blocks, styles, media, and content.
5. Save the page.
6. Publish or set the page as active.
7. Copy the public URL or open the live page.

**Expected Result**
1. The organization landing page is created or updated successfully.
2. The public URL displays the active page.

##### Billing (Route: `/tenant/[tenant]/billing`)
**Preconditions**
1. The user is logged in.

**User Interface**
- Current plan card
- Usage meters
- Available plans
- Billing history table

**Steps**
1. Open `Billing`.
2. Review the current subscription plan.
3. Check AI usage and quota meters.
4. Review available plans.
5. Review billing history and invoices.

**Expected Result**
1. Billing status and usage are visible.
2. The admin can monitor subscription consumption.

#### 2.4 Project Manager / Project Lead
The Project Manager / Project Lead role focuses on project setup, task execution, project members, project roles, and project-level reporting.

##### Create Project (Route: `/tenant/[tenant]/projects`)
**Preconditions**
1. The user is logged in.
2. The account can create projects.

**User Interface**
- Projects list
- `New Project` button
- Project creation dialog

**Steps**
1. Open `Projects`.
2. Click `New Project`.
3. Enter project details, dates, status, priority, budget, and manager assignments.
4. Click `Create Project`.

**Expected Result**
1. The project is created successfully.
2. The user can open the new project detail page.

##### Project Detail Hub (Route: `/tenant/[tenant]/projects/[id]`)
**Preconditions**
1. The user is logged in.
2. The user can access the selected project.

**User Interface**
- Project header
- Progress summary cards
- Detail tab navigation

**Steps**
1. Open a project from the project list.
2. Review project progress, dates, and task counts.
3. Switch between project tabs as needed.

**Expected Result**
1. The project detail hub loads correctly.
2. The user can access project-level modules from one page.

##### Manage Project Tasks (Route: `/tenant/[tenant]/projects/[id]/board`)
**Preconditions**
1. The user is logged in.
2. The user can view the project board.

**User Interface**
- Board/List view switch
- Search field
- Task filters
- Create task dialog

**Steps**
1. Open the `Task Board` tab.
2. Switch between `Board` and `List`.
3. Search for tasks if needed.
4. Apply status, assignee, tag, or priority filters.
5. Create a new task.
6. Update task fields through task detail or edit flow.

**Expected Result**
1. Tasks can be created and managed successfully.
2. The board reflects the latest task status.

##### Project Members and Roles (Routes: `/tenant/[tenant]/projects/[id]/members`, `/tenant/[tenant]/projects/[id]/roles`)
**Preconditions**
1. The user is logged in.
2. The user can manage project membership or roles.

**User Interface**
- Member management page
- Invite member dialog
- Project roles page

**Steps**
1. Open the `Members` tab.
2. Invite project members if needed.
3. Review current project members.
4. Open the `Roles` tab.
5. Review project roles and permission trees.

**Expected Result**
1. Project membership is managed correctly.
2. Project roles and permissions are visible and configurable for authorized users.

##### Project Documents, KPI, and Report View (Routes: `/tenant/[tenant]/projects/[id]/documents`, `/tenant/[tenant]/projects/[id]/kpi`, `/tenant/[tenant]/projects/[id]/reports`)
**Preconditions**
1. The user is logged in.
2. The user can access project documents or analytics.

**User Interface**
- Project documents page
- Project KPI pages
- Report view page

**Steps**
1. Open the `Documents` tab to review project-level files.
2. Open the `KPI` tab to review project KPI data.
3. Open the `Report view` tab to review project reports.

**Expected Result**
1. Project-level resources are available in one project context.
2. Managers can monitor delivery and performance more easily.

### 3. Common Notes
1. Feature visibility depends on RBAC permissions.
2. Some pages may be hidden or locked if the user does not have the required permission.
3. AI quota, billing values, and some analytics data depend on backend configuration.
4. The exact deployment URL should be inserted into this document before final submission.

### 4. Recommended End-to-End UAT Scenarios

#### Guest UAT Scenario
1. Access the website.
2. Register an account.
3. Verify email.
4. Log in.
5. Accept an invitation if provided.

#### Workspace User UAT Scenario
1. Log in.
2. Select a workspace.
3. Open the dashboard.
4. Upload a document.
5. Ask a question in the AI chatbot.
6. Send a message in team chat.
7. Create a ticket request.
8. Submit a daily report.
9. Update the user profile.

#### Organization Admin UAT Scenario
1. Log in and open a workspace.
2. Invite members.
3. Manage members.
4. Create or update a role.
5. Update organization profile and branding.
6. Update organization settings and working time.
7. Review KPI and periodic reports.
8. Publish a landing page.
9. Review billing usage.

#### Project Manager UAT Scenario
1. Create a project.
2. Open the project detail hub.
3. Create and update tasks in the board.
4. Invite project members.
5. Review project roles.
6. Review project KPI and report pages.
