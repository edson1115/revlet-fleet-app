// components/SignOutButton.tsx
export default function SignOutButton() {
  return (
    <form action="/logout" method="post">
      <button
        type="submit"
        className="px-3 py-1 rounded border hover:bg-gray-50"
        title="Sign out"
      >
        Sign out
      </button>
    </form>
  );
}



