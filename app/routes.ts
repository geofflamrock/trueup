import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("groups/new", "routes/groups.new.tsx"),
  route(":groupId", "routes/group.tsx"),
  route(":groupId/edit", "routes/group.edit.tsx"),
  route(":groupId/delete", "routes/group.delete.tsx"),
  route(":groupId/expenses/new", "routes/expenses.new.tsx"),
  route(":groupId/expenses/:expenseId/edit", "routes/expenses.edit.tsx"),
  route(":groupId/expenses/:expenseId/delete", "routes/expenses.delete.tsx"),
  route(":groupId/transfers/new", "routes/transfers.new.tsx"),
  route(":groupId/transfers/:transferId/edit", "routes/transfers.edit.tsx"),
  route(":groupId/transfers/:transferId/delete", "routes/transfers.delete.tsx"),
] satisfies RouteConfig;
