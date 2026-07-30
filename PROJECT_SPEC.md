# SAP Material Stock - Project Specification

## 1. Purpose

SAP Material Stock is a web dashboard for viewing material inventory held in SAP S/4HANA Cloud. It gives operational users a quick, searchable view of stock by material, plant, and storage location, and highlights items with low quantities.

## 2. Current Scope

The application currently provides a single dashboard page at `/`. It retrieves live stock data from SAP through a server-side application endpoint and presents it in a paginated inventory table.

### Users

Internal users who need to inspect SAP material stock, such as inventory, warehouse, procurement, or operations staff.

### Primary user goals

- Find a material or plant quickly.
- See its storage location, available quantity, and base unit.
- Identify quantities below the low-stock threshold.
- Mark useful rows as favourites during the current browser session.
- Add a short memo to a material during the current browser session.

## 3. Functional Requirements

### 3.1 SAP data retrieval

- The app must expose `GET /api/materials`.
- The endpoint must request the SAP OData `A_MatlStkInAcctMod` collection.
- Requests must be authenticated using SAP communication credentials stored in server-only environment variables.
- The endpoint must request JSON, exclude blank material values, and return up to 1,500 records.
- The endpoint must handle the SAP OData response shapes currently supported by the implementation: `d.results`, `d` as an array, or a single object in `d`.
- API responses must not be cached by the application.
- Missing configuration, SAP HTTP errors, and connection failures must return a JSON error response.

### 3.2 Inventory dashboard

- The dashboard must load material data when the page opens.
- While data loads, it must show a loading state.
- If loading fails, it must show an error state with the returned or fallback message.
- Each SAP record must be displayed with:
  - Material code
  - Plant
  - Storage location
  - Quantity
  - Material base unit
  - Stock status
  - Favourite control
  - Memo control
- Quantity must be parsed as a number; unparseable values are treated as zero.
- A quantity below `10` must have the status `Low`; all other quantities have the status `OK`.
- Low-stock rows must be visually highlighted.

### 3.3 Search, filters, and sorting

- Users must be able to search case-insensitively by material code or plant.
- Search changes must reset the result view to page one.
- Users must be able to filter to favourites or rows with memos; selecting the active filter again must clear it.
- A reset action must clear search text and filters.
- Users must be able to sort the full material list alphabetically by material code or plant.

### 3.4 Pagination and summary

- The table must display 12 rows per page.
- Users must be able to move to the previous and next pages within the valid range.
- The dashboard must show the visible row range and filtered result count.
- The dashboard must show counts for favourites, memos, OK-stock items, and low-stock items.

### 3.5 Favourites and memos

- A user must be able to toggle a favourite state for each material row.
- A user must be able to open a modal, enter a note, submit it, edit it later, or cancel editing.
- A non-empty submitted note marks that material as having one memo; an empty submitted note clears the memo marker.
- Favourites and memos are stored only in client-side React state and are lost on refresh, navigation away, or a new session.

## 4. Data Model

### SAP source record

| Field | Description |
| --- | --- |
| `Material` | SAP material identifier |
| `Plant` | Plant identifier |
| `StorageLocation` | Storage-location identifier |
| `MaterialBaseUnit` | Base unit of measure |
| `MatlWrhsStkQtyInMatlBaseUnit` | Warehouse stock quantity in the base unit |

### Dashboard record

| Field | Description |
| --- | --- |
| `id` | Client-generated row identifier |
| `material`, `plant`, `storageLocation` | Display identifiers mapped from SAP |
| `quantity`, `unit` | Parsed quantity and base unit |
| `status` | `Low` when quantity is below 10; otherwise `OK` |
| `favourite`, `memoCount` | Client-only UI state |

## 5. Technical Architecture

```text
Browser dashboard
  -> GET /api/materials (Next.js route handler)
    -> SAP S/4HANA Cloud OData API
  <- normalized SAP records
<- client-side display, filtering, sorting, pagination, favourites, and memos
```

- Framework: Next.js 16 with React 19 and TypeScript.
- Styling: Tailwind CSS 4.
- Server integration: a Next.js route handler keeps SAP credentials out of the browser.
- Main implementation locations:
  - `app/page.tsx` - dashboard route
  - `app/components/materials/` - dashboard UI and interactions
  - `app/api/materials/route.ts` - SAP integration endpoint
  - `types/material.ts` - SAP and UI data types

## 6. Configuration and Security

The following server environment variables are required:

| Variable | Purpose |
| --- | --- |
| `SAP_MATERIAL_API_URL` | Base URL for the SAP material-stock OData service |
| `SAP_COMM_USER` | SAP communication user |
| `SAP_COMM_PASSWORD` | SAP communication password |

- Secrets must remain in local or deployment environment configuration and must never be committed to source control or sent to the browser.
- The SAP endpoint is called only from the server route handler.
- Production deployment should use a secret manager or protected environment variables, HTTPS, and SAP credentials with the least privileges necessary.

## 7. Non-Functional Requirements

- The page should remain usable on common desktop screen sizes and use a scrollable table region.
- Interactive controls must have understandable labels; pagination uses an accessible navigation landmark and the memo dialog declares dialog semantics.
- SAP integration errors must be logged server-side without exposing credentials to users.
- The endpoint must fetch fresh inventory data for each request.

## 8. Known Limitations / Out of Scope

- There is no user authentication or role-based access control in the app.
- Favourites and memos are not persisted or shared between users.
- The low-stock threshold is hard-coded to 10 and is not configurable per material, plant, or user.
- The SAP request uses a fixed maximum of 1,500 records and has no server-side paging, filtering, or retry strategy.
- The dashboard is read-only; it does not create or update SAP inventory records.
- Automated test coverage is not currently included.

## 9. Acceptance Criteria

- With valid SAP configuration, opening `/` loads stock data and renders the dashboard table.
- Searching by a known material code or plant narrows the results appropriately.
- Materials below quantity 10 show `Low` status and low-stock styling.
- Favourites and memos can be added, filtered, and cleared during the same session.
- Pagination displays no more than 12 records per page and prevents movement before page 1 or after the final page.
- With missing or invalid SAP configuration, the user receives a clear error state and no secret is exposed.
