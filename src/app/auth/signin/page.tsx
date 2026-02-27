import { signIn } from "@/auth";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-light-gray">
      <form
        action={async (formData) => {
          "use server";
          await signIn("credentials", formData);
        }}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold text-black mb-6 text-center">Sign In</h1>
        <div className="mb-4">
          <label htmlFor="email" className="block text-black text-sm font-bold mb-2">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-black text-sm font-bold mb-2">
            Password:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black mb-3 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          type="submit"
          style={{ backgroundColor: '#730404' }} // Direct inline style
          className="hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
        >
          Sign In
        </button>
        <div className="text-center mt-4">
          <Link href="/auth/request-account" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
            Request New Account
          </Link>
        </div>
      </form>
    </div>
  );
}