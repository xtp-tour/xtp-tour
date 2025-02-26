
import './App.css'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { ChallengesList } from './components/ChallengesList';

function App() {
  const { user } = useUser();

  return (
    <>
     <header>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
        {user?.phoneNumbers?.[0]?.phoneNumber && (
          <div>Phone: {user.phoneNumbers[0].phoneNumber}</div>
        )}
      </SignedIn>
    </header>

      <SignedIn>
        <ChallengesList />
      </SignedIn>

    </>
  )
}

export default App
