export default function AuthSuccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Google Calendar Connected!</h1>
        <p className="text-gray-600 mb-6">You can now close this window and return to the app.</p>
        <p className="text-sm text-gray-500">
          Your calendars are now accessible, including Partiful and other &quot;Other calendars&quot;.
        </p>
      </div>
    </div>
  )
}