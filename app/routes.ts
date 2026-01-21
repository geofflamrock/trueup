import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("", "routes/home.tsx", [route("groups/new", "routes/groups.new.tsx")]),
  route(":groupId", "routes/group.tsx", [
    route("edit", "routes/group.edit.tsx"),
    route("delete", "routes/group.delete.tsx"),
    route("expenses/new", "routes/expenses.new.tsx"),
    route("expenses/:expenseId/edit", "routes/expenses.edit.tsx"),
    route("expenses/:expenseId/delete", "routes/expenses.delete.tsx"),
    route("transfers/new", "routes/transfers.new.tsx"),
    route("transfers/:transferId/edit", "routes/transfers.edit.tsx"),
    route("transfers/:transferId/delete", "routes/transfers.delete.tsx"),
  ]),
] satisfies RouteConfig;
