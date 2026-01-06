export function getRoleHome(role?: string) {
  switch (role) {
    case "SUPERADMIN":
    case "ADMIN":
      return "/admin";
    case "OFFICE":
      return "/office";
    case "DISPATCH":
      return "/dispatch";
    case "TECH":
      return "/tech";
    default:
      return "/login";
  }
}
