# Frontdesk Orbit Manager

Build an AI Receptionist SaaS Dashboard(Beginer friendly code)

Build a modern, professional, responsive SaaS web application for an AI Receptionist Platform. The platform allows businesses to configure an AI receptionist that will eventually answer incoming phone calls, respond to FAQs, explain services and prices, collect customer information, book appointments in management software, and transfer calls to human staff when requested.

Important: Build the dashboard and its core functionality first. Do not implement telephony or live voice calling yet. However, structure the application so these features can be integrated later.

1. Technology Stack

- Frontend: React with TypeScript
- Styling: Tailwind CSS
- UI components: shadcn/ui
- Icons: Lucide
- Charts: Recharts
- Backend and database: Supabase with PostgreSQL
- Authentication: Supabase Auth
- Use reusable components and a clean project structure.

2. Design Requirements

Create a premium, modern SaaS interface inspired by high-quality CRM and business management platforms.

- Clean, professional layout with a collapsible left sidebar.
- Light theme with a white background, subtle gray borders, and restrained blue accents.
- Use consistent spacing, typography, rounded cards, and subtle shadows.
- Fully responsive on desktop, tablet, and mobile.
- Include loading states, empty states, form validation, confirmation dialogs, and toast notifications.
- Avoid excessive gradients, oversized headings, and unnecessary animations.
- Use realistic sample data and clearly identify demo data as sample data.

3. Main Navigation

Create the following sidebar navigation:

1. Overview
2. AI Receptionist
3. Services & Pricing
4. FAQs & Knowledge Base
5. Appointments
6. Customers
7. Call History
8. Business Settings
9. Integrations
10. Subscription & Billing

Include the business logo/name, user profile menu, and logout option.

4. Dashboard Overview

Create an overview page containing:

Summary cards

- Total Calls
- Calls Answered by AI
- Appointments Booked
- Calls Transferred to Humans
- Unanswered Calls

Charts

- Call volume over time
- AI-handled versus human-transferred calls
- Appointment booking trends

Recent activity

- Recent calls with customer name, phone number, date, duration, and outcome.
- Upcoming appointments with customer name, service, date, and status.
- AI receptionist status indicator.

All statistics should be calculated from available records. Never present sample statistics as actual live business activity.

5. AI Receptionist Configuration

Create a page where businesses can configure their future AI receptionist.

Include:

- Receptionist name
- Greeting message
- Business description
- Supported language selection
- Business opening hours
- After-hours behavior
- Instructions for answering customers
- Enable/disable receptionist toggle
- Human handoff settings
- Fallback message when the AI cannot answer a question

Add a preview panel showing the configured greeting and receptionist instructions.

For now, save configuration settings in the database. The enable/disable toggle must control the saved configuration state, but must not imply that real phone calls are active.

6. Services & Pricing

Allow businesses to manage the services their AI receptionist can explain to customers.

Each service should have:

- Service name
- Description
- Price
- Duration
- Availability status

Features:

- Add service
- Edit service
- Delete service with confirmation
- Search and filter services
- Enable or disable individual services

Store service information in the database. The future AI agent will use this information to answer customer questions accurately.

7. FAQs & Knowledge Base

Create an FAQ management interface.

Each FAQ should contain:

- Question
- Approved answer
- Category
- Active/inactive status
- Last updated date

Features:

- Create, edit, and delete FAQs
- Search FAQs
- Filter by category
- Add business policies and general information
- Display a notice that the future AI must use approved business information and should not invent answers

Prepare the data structure for future integration with AI retrieval or a knowledge-base search system. Do not claim that an AI voice agent is already connected.

8. Appointments

Build an appointment management page with:

- Calendar view
- List view
- Customer name and contact information
- Selected service
- Appointment date and time
- Appointment status: Pending, Confirmed, Completed, or Cancelled
- Internal notes

Allow authorized users to create, edit, confirm, cancel, and view appointments.

Prevent invalid appointment times and validate required fields. Design the backend so future AI agents can create bookings through a secure API after checking availability.

9. Customer Management

Create a customer directory with:

- Full name
- Phone number
- Email address, if available
- Customer notes
- Last interaction
- Total appointments

Include search, sorting, customer detail pages, and appointment history.

Use appropriate privacy controls and restrict access to authorized users within the relevant business account.

10. Call History

Create a call history page with a table containing:

- Caller name
- Phone number
- Call date and time
- Call duration
- Call outcome
- AI handled or human transferred
- Call summary
- Booking created, if applicable

Include search, date filters, outcome filters, and a call detail drawer.

Initially, use clearly labeled sample records. Build the data model so real call logs, transcripts, and recordings can be added in the future.

Do not create fake recordings or imply that live telephony is working.

11. Business Settings

Create settings sections for:

- Business name and logo
- Business description
- Address and contact details
- Time zone
- Opening hours
- Holidays and special opening hours
- Default currency
- Appointment policies
- Human handoff contact details

Make settings editable and persist changes in the database.

12. Integrations

Create an integrations page with cards for:

- Telephony / SIP
- AI voice provider
- Calendar and booking software
- CRM or management software
- Email and notifications

Each card should show its status: Not Connected, Connected, or Needs Configuration.

For the initial version, these are configuration placeholders. Do not display a Connected status unless a real integration has been configured and verified.

Prepare the application for future Asterisk/FreePBX, SIP trunk, and AI voice API integration.

13. Subscription & Billing

Create a basic subscription page showing:

- Current plan
- Monthly price
- Usage overview
- Call minutes used
- Billing history
- Upgrade or manage plan actions

Use clearly labeled demo data until a real payment provider is connected. Do not process real payments yet.

14. Database Design

Use Supabase PostgreSQL and create appropriate tables for:

- businesses
- business_members
- receptionist_settings
- services
- faqs
- customers
- appointments
- call_logs
- integrations
- subscriptions

Use UUID primary keys, timestamps, appropriate foreign keys, and sensible constraints.

Implement Supabase Row Level Security (RLS) policies so users can access only the businesses and records they are authorized to manage. Do not rely only on frontend filtering for security.

15. Functional Requirements

- All navigation links must work.
- Forms must validate input.
- CRUD operations must persist to the database.
- Search and filters must function.
- Dashboard metrics must be derived from stored records.
- Include realistic loading, error, empty, and success states.
- Add authentication and protected routes.
- Make destructive actions require confirmation.
- Do not expose service-role keys or secrets in frontend code.
- Never claim that telephony, AI calling, payments, or external integrations are operational until they are genuinely connected.

16. Development Approach

Build the application in stages:

Stage 1: Create the complete responsive UI and navigation.

Stage 2: Implement authentication, database schema, and Row Level Security.

Stage 3: Connect CRUD operations for services, FAQs, customers, and appointments.

Stage 4: Implement dashboard analytics and call history using stored records.

Stage 5: Add configuration pages and integration placeholders.

Final objective: Deliver a functional, polished dashboard that a business can use to manage its information and appointments today, and that can later become the control panel for a fully integrated AI receptionist SaaS platform.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8329cfce-2c0e-4eea-912f-8f319b66a0b6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
