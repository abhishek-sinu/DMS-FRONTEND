# DMS-FRONTEND

## How to Start the Frontend

1. Open a terminal and navigate to the `DMS-FRONTEND` directory:
	```sh
	cd DMS-FRONTEND
	```
2. Install dependencies:
	```sh
	npm install
	```
3. Start the frontend development server(nothing may happen in first run, second run it says compiled succesfully! It was success in 3rd run to me not sure why at the moment! Ask for username & Passsword to login to website or create via signup to store in local database):
	```sh
	npm start
	```
4. The frontend will typically run on [http://localhost:3000](http://localhost:3000).

---

## Dashboard donor details

Dashboard summary cards use two columns (one on small screens) and wrap large
totals instead of truncating them, keeping the complete donation amount visible.

Click **View** in Upcoming Anniversaries or Upcoming Birthdays to see the donor's
complete details. The address uses the same formatting as donation receipts:
structured address fields first, then older house/city/state/PIN fields, then the
original free-text address. A dash is shown when no address is saved.
The birthday and anniversary Excel/PDF downloads include the list entries and
all details shown by **View**: donor name, phone, email, date of birth,
anniversary, full address, and every family member's name, relation, and DOB.
PDFs use a wrapped detail layout instead of a compact table to avoid clipping
addresses or family details.

## Gift donor phone suggestions

In **Gifts > Add Gift**, type at least three phone digits to search existing
donors. Up to ten search results are checked for matching phone numbers.
Choose a donor by name and phone to fill in the complete phone number.
Suggestions can be selected using Tab and Enter; Escape dismisses them.
Manual phone entry remains available.
Gift phone numbers accept ten digits with an optional leading zero, which is
preserved when submitting to match the donor's saved phone number.

## Gift table export

Use **Export XLS** or **Export CSV** beside the Gifts import controls to download
all rows matching the current search across every page. Downloads include phone,
gift name, description, numeric value, and date given, without action buttons.
XLS preserves leading-zero phones as text. When opening CSV in a spreadsheet,
import the phone column as text to preserve zeros. CSV escapes formula-like text.
XLS supports up to 65,535 data rows; use CSV for larger exports.

## Scheme table export

Use **Export XLS** beside the scheme search to download all matching schemes
across every page. The file includes row numbers and scheme names, without
action buttons. Refine the search if results exceed the XLS limit of 65,535
data rows.

## Donation table export

Use **Export XLS** or **Export CSV** beside the import controls in Donations.
Exports include all matching rows across every page, respect the current search
and the signed-in user's access, and contain all eight data columns from the
table (without action buttons). XLS exports preserve phone, receipt, and
instrument numbers as text. CSV escapes formula-like text for spreadsheet
safety; import identifier columns as text when opening CSV to preserve leading
zeros. XLS is limited to 65,535 data rows; use CSV for larger exports.