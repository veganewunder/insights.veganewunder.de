export async function getCurrentSession() {
  return {
    user: {
      id: "demo-admin",
      email: "admin@veganewunder.de",
      role: "admin",
    },
  };
}
