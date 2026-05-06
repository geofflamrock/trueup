import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("groups/new", "routes/group.new.tsx"),
  route(":groupId", "routes/group.tsx", [
    index("routes/group.home.tsx"),
    route("breakdown", "routes/group.breakdown.tsx"),
    route("activity", "routes/group.activity.tsx"),
    route("settings", "routes/group.settings.tsx", [
      route("delete", "routes/group.delete.tsx"),
    ]),
    route("share", "routes/group.share.tsx"),
    route("share/stop", "routes/group.share.stop.tsx"),
    route("share/delete", "routes/group.share.delete.tsx"),
    route("disconnect", "routes/group.disconnect.tsx"),
  ]),
  route(":groupId/expenses/new", "routes/expense.new.tsx"),
  route(":groupId/expenses/:expenseId", "routes/expense.edit.tsx", [
    route("delete", "routes/expense.delete.tsx"),
  ]),
  route(":groupId/transfers/new", "routes/transfer.new.tsx"),
  route(":groupId/transfers/:transferId", "routes/transfer.edit.tsx", [
    route("delete", "routes/transfer.delete.tsx"),
  ]),
  route("join/:shareId", "routes/join.$shareId.tsx"),
  route("api/shares/:shareId", "routes/api.shares.$shareId.tsx"),
] satisfies RouteConfig;
