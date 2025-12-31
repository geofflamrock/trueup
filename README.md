# TrueUp

An expense tracking app for groups to manage shared expenses and settle balances.

## About

When a group of people are traveling together or doing shared activities, different people often pay for expenses at different times. TrueUp helps groups track who paid what, how expenses should be split, and automatically calculates who owes money to whom to "true up" the balances.

All data is stored securely on your device - nothing is stored on the internet and no account is required.

## How to Use

### Creating a Group

1. From the home page, click the "Create New Group" link
2. Enter a group name (e.g., "Trip to Paris")
3. Add people to the group with their names
4. Click "Create Group"

### Managing People

- **Add people**: Click the "Edit" button next to the group name, then add new people
- **Edit names**: Edit person names from the group edit page
- **Remove people**: Remove people from the edit page (validation prevents removing people with expenses/transfers)

### Recording Expenses

1. From a group page, click "+ Add Expense"
2. Enter the expense details:
   - Description (e.g., "Hotel booking")
   - Amount (e.g., 300.00)
   - Who paid for it
   - How to split it:
     - **Split Equally**: Divides amount evenly among selected people
     - **Custom Split**: Set individual amounts for each person (must total the expense amount)
3. Click "Add Expense"

### Recording Transfers

1. From a group page, click "+ Add Transfer"
2. Enter the transfer details:
   - From person (who paid)
   - To person (who received payment)
   - Amount
3. Click "Add Transfer"

### Viewing Balances

The group page shows "Who Owes What" - a summary of all outstanding balances. The app automatically calculates the optimal way to settle all debts with the minimum number of transfers.

For example:
- Alice paid $300 for a hotel
- Split equally: Alice $100, Bob $100, Charlie $100
- Bob transferred $100 to Alice
- **Result**: Charlie owes Alice $100

### Editing and Deleting

- **Edit**: Click the "Edit" button next to any group, expense, or transfer
- **Delete**: Click "Delete" buttons to remove items (with confirmation)
  - Expenses and transfers can always be deleted
  - People can only be deleted if they have no associated expenses or transfers
  - Deleting a group removes all data for that group

---

## For Developers

### Getting Started

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Building for Production

Create a production build:

```bash
npm run build
```

### Technical Implementation

- **Framework**: React Router 7 (SPA mode, client-side only)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Storage**: Browser LocalStorage (no server/backend required)
- **ID Format**: 
  - Groups: 8-character hexadecimal
  - People: Sequential integers
  - Expenses/Transfers: GUIDs with ISO 8601 timestamps
- **Balance Algorithm**: Greedy algorithm matches debtors to creditors, minimizing transaction count

---

Built with React Router and TypeScript.
