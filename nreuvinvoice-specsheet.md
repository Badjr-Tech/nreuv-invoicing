{\rtf1\ansi\ansicpg1252\cocoartf2867
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;\red42\green75\blue126;\red63\green108\blue175;\red0\green0\blue0;
}
{\*\expandedcolortbl;;\cssrgb\c21176\c37255\c56863;\cssrgb\c30980\c50588\c74118;\cssrgb\c0\c0\c0;
}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\sl429\partightenfactor0

\f0\fs37\fsmilli18667 \cf2 \expnd0\expndtw0\kerning0
Simple Invoicing Platform \'96 Complete Build Specification\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 Tech Stack\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 - Next.js (App Router)\uc0\u8232 - Neon PostgreSQL\u8232 - Prisma ORM\u8232 - NextAuth (Credentials Authentication)\u8232 - Server-side PDF + CSV generation\u8232 - Vercel deployment\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 User Roles\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 Admin:\uc0\u8232 - Full system access\u8232 \u8232 Payroll Manager:\u8232 - Can view all invoices\u8232 - Can approve invoices\u8232 - Can download PDFs\u8232 - Cannot edit settings\u8232 - Cannot manage categories\u8232 - Cannot configure deadlines\u8232 - Cannot export CSV\u8232 \u8232 User (Employee/Contractor):\u8232 - Can create invoices\u8232 - Can edit Draft invoices\u8232 - Can send invoices\u8232 - Can view only their own invoices\u8232 - Cannot approve\u8232 - Cannot export CSV\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 Dashboard Behavior\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 User Dashboard:\uc0\u8232 - Displays only their own invoices\u8232 - Columns: Invoice Date, Due Date, Status, Total Hours, Total Cost (if approved), Countdown (if Draft)\u8232 - Countdown banner: "Next invoice due in X days"\u8232 - Overdue indicator if past due\u8232 \u8232 Admin Dashboard:\u8232 - Displays all users and invoices\u8232 - Employee sidebar with notification badges\u8232 - Sortable and filterable table\u8232 \u8232 Payroll Manager Dashboard:\u8232 - Same as Admin except cannot export CSV or change system settings\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 Sorting & Filtering (Admin Only)\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 Sortable By:\uc0\u8232 - Employee Name\u8232 - Invoice Date\u8232 - Due Date\u8232 - Status\u8232 - Total Hours\u8232 - Total Cost\u8232 \u8232 Filterable By:\u8232 - Employee\u8232 - Status\u8232 - Invoice Date range\u8232 - Due Date range\u8232 \u8232 Server-side sorting and filtering only.\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 CSV Export (Admin Only)\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 - Export respects current filters and sorting\uc0\u8232 - Includes: Employee Name, Invoice Date, Due Date, Status, Total Hours, Total Cost, Submitted Date, Approved Date\u8232 - Server-side generation\u8232 - Protected route (Admin only)\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 Invoice Lifecycle\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 Draft \uc0\u8594  Sent \u8594  Approved\u8232 \u8232 Rules:\u8232 - Draft editable\u8232 - Sent locked\u8232 - Approved permanently locked\u8232 - Totals calculated server-side\u8232 - Due date auto-calculated at creation\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 Deadline & Countdown System\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 Admin configures recurrence:\uc0\u8232 - Weekly\u8232 - Biweekly\u8232 - Monthly\u8232 - Custom interval\u8232 \u8232 Due date auto-calculated.\u8232 Countdown colors:\u8232 - Green (5+ days)\u8232 - Yellow (2\'964 days)\u8232 - Red (1 day or overdue)\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 Database Tables\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 users\uc0\u8232 invoice_deadline_settings\u8232 categories\u8232 payment_schedules\u8232 invoices\u8232 invoice_items\u8232 notifications\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 Security Requirements\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 - Role-based middleware\uc0\u8232 - Server-side validation\u8232 - Protected CSV route\u8232 - Protected approval route\u8232 - CSRF protection\u8232 - Bcrypt password hashing\u8232 - Secure session cookies\
\pard\pardeftab720\sl398\partightenfactor0

\fs34\fsmilli17333 \cf3 Definition of Completion\
\pard\pardeftab720\sl337\sa266\partightenfactor0

\fs29\fsmilli14667 \cf4 - Users see only their invoices\uc0\u8232 - Admin sees all users\u8232 - Sidebar notifications function\u8232 - Sorting and filtering work server-side\u8232 - CSV export works for Admin only\u8232 - Deadline calculation accurate\u8232 - Countdown accurate\u8232 - Approval workflow functional\u8232 - PDF generation functional\u8232 - All permissions enforced\
}