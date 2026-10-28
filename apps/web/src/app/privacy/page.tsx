import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { COMPANY_ADDRESS, COMPANY_NAME, LEGAL_EMAIL } from "@/lib/legal";

export const metadata = {
  title: "Privacy Policy — IPSkill",
  description: "What IPSkill collects, who can see it, and your rights under POPIA.",
};

export default function PrivacyPage() {
  const email = <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>;

  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <>
          This policy explains what personal information IPSkill collects, why, who can see it and what you can do
          about it. It is written to meet South Africa&apos;s Protection of Personal Information Act (POPIA).
        </>
      }
    >
      <h2>1. Who we are</h2>
      <p>
        IPSkill is run by {COMPANY_NAME} (&quot;we&quot;, &quot;us&quot;), {COMPANY_ADDRESS}. We are the responsible
        party for your personal information under POPIA. Our Information Officer is the owner of {COMPANY_NAME}, and
        you can reach them at {email} about anything in this policy.
      </p>

      <h2>2. What we collect</h2>
      <h3>When you sign in</h3>
      <ul>
        <li>
          <strong>GitHub:</strong> your account ID, username, name, email address and profile picture, and public
          information about your work: your public repositories, the languages in them, commits, pull requests,
          issues, stars, followers and contribution calendar. We do not read private repositories. We keep the access
          token GitHub gives us so we can refresh this information, and only use it to read.
        </li>
        <li>
          <strong>Google or LinkedIn:</strong> your account ID, name, email address and profile picture.
        </li>
      </ul>
      <h3>What you add</h3>
      <ul>
        <li>
          Your display name, profile handle, &quot;about&quot; and &quot;currently&quot; text, company, video intro
          link, work experience, certifications, featured projects, external links and proof-of-work links.
        </li>
        <li>Your answers and scores on skill tests.</li>
        <li>Your settings, such as whether your public page is on and who may message you.</li>
      </ul>
      <h3>What you do with other people</h3>
      <ul>
        <li>Messages and message requests, endorsements, follows and kudos.</li>
        <li>Interview requests, including the time slots offered and chosen.</li>
        <li>For recruiters: shortlists, saved searches and the candidates in them.</li>
      </ul>
      <h3>What we record automatically</h3>
      <ul>
        <li>Which signed-in members viewed your profile, so we can show you who is interested.</li>
        <li>Your notifications, the history of your overall score, and referral codes.</li>
        <li>
          The email address and IP address used for each sign-in or sign-up attempt, kept for about a day to stop
          password guessing and spam.
        </li>
        <li>
          If you use the IPSkill mobile app and allow notifications, your device&apos;s push notification token.
        </li>
        <li>Technical error reports when something breaks, with personal details removed before they are sent.</li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>
          <strong>To run IPSkill for you</strong> (needed to provide the service you signed up for): building your
          skill fingerprint and profile, showing it to the people your settings allow, and delivering messages and
          notifications.
        </li>
        <li>
          <strong>To connect developers with recruiters</strong> (our legitimate interest, and the reason IPSkill
          exists): letting approved recruiters find and contact developers, as described in section 4.
        </li>
        <li>
          <strong>To keep IPSkill safe</strong> (legitimate interest): limiting sign-in attempts, moderating profiles
          and fixing errors.
        </li>
      </ul>
      <p>We do not sell personal information, and we do not use advertising or tracking cookies.</p>

      <h2>4. Who can see your information</h2>
      <ul>
        <li>
          <strong>Anyone, if you switch on your public page.</strong> Your profile is then shown at your own link,
          listed on the Discover page and may appear in search engines. You can switch it off at any time.
        </li>
        <li>
          <strong>Anyone with a private share link you create</strong>, until it expires or you revoke it.
        </li>
        <li>
          <strong>Approved recruiters.</strong> If you signed in with GitHub, a summary of your profile (name, GitHub
          username, picture, headline, location, scores, top languages, skill fingerprint, about text, company and
          whether you are open to opportunities) is listed in the Recruiter Directory,{" "}
          <strong>even if your public page is off</strong>. Recruiters there can open your profile, add you to
          shortlists, compare you with other candidates, propose interviews and message you (or send a message request,
          if you chose that in Settings). You can see which recruiters viewed your profile. Recruiter access is
          granted by us, one recruiter at a time.
        </li>
        <li>
          <strong>Other members</strong> see the endorsements, follows and kudos you give, and the people you message
          see your messages.
        </li>
        <li>
          <strong>Our administrators</strong>, to review and hide profiles that break our{" "}
          <Link href="/terms">terms</Link>.
        </li>
      </ul>

      <h2>5. Service providers and transfers outside South Africa</h2>
      <p>We use these providers to run IPSkill. They process information on our behalf and only for that purpose:</p>
      <ul>
        <li>
          <strong>Supabase</strong> stores our database, in Ireland (European Union).
        </li>
        <li>
          <strong>Vercel</strong> hosts the website and processes requests, mainly in the United States.
        </li>
        <li>
          <strong>GitHub, Google and LinkedIn</strong> handle sign-in, and GitHub supplies your public work data.
        </li>
        <li>
          <strong>Sentry</strong> receives error reports, with personal details removed.
        </li>
        <li>
          <strong>Expo</strong> delivers mobile push notifications.
        </li>
      </ul>
      <p>
        This means your information is transferred outside South Africa. We only use providers that are bound by data
        protection laws or agreements giving a level of protection comparable to POPIA, as section 72 of POPIA
        requires.
      </p>

      <h2>6. Cookies and browser storage</h2>
      <p>
        We only use the cookies needed to keep you signed in and protect sign-in forms, plus browser storage for small
        preferences such as light or dark mode. There are no analytics or advertising cookies.
      </p>

      <h2>7. How long we keep it</h2>
      <ul>
        <li>Your profile and what you add: for as long as you have an account.</li>
        <li>Information copied from GitHub: refreshed as you use IPSkill and deleted with your account.</li>
        <li>Sign-in attempt records: about a day.</li>
        <li>
          When you delete your account (Settings → Delete account), your profile and everything you added are deleted
          straight away, along with your conversations, for both people in them. If you ask us by email instead, we do
          it within 30 days. Notifications already sent to other people, such as &quot;you were endorsed&quot;, stay in
          their inbox.
        </li>
      </ul>

      <h2>8. How we protect it</h2>
      <p>
        All traffic is encrypted. The database can only be reached by our own servers, never directly from a browser.
        You sign in through GitHub, Google or LinkedIn, so we never see your password for those accounts, and repeated
        sign-in attempts are blocked. No system is perfectly secure; if a breach affects your information, we will
        tell you and the Information Regulator as POPIA requires.
      </p>

      <h2>9. Your rights</h2>
      <p>Under POPIA you can:</p>
      <ul>
        <li>ask what personal information we hold about you and get a copy of it;</li>
        <li>correct it (most of it you can edit yourself in IPSkill);</li>
        <li>delete your account yourself from Settings, or ask us to delete your information;</li>
        <li>object to us using it, including for the Recruiter Directory;</li>
        <li>withdraw any consent you gave.</li>
      </ul>
      <p>
        Email {email} and we will reply within 30 days. If you are not happy with our answer, you can complain to the
        Information Regulator of South Africa (
        <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">
          inforegulator.org.za
        </a>
        ).
      </p>

      <h2>10. Age</h2>
      <p>IPSkill is for people aged 18 and over. We do not knowingly collect information about children.</p>

      <h2>11. Changes to this policy</h2>
      <p>
        We will update the date at the top whenever this policy changes, and tell you in IPSkill before a change that
        affects how your information is used or shared takes effect.
      </p>

      <h2>12. Contact</h2>
      <p>
        {COMPANY_NAME}, {COMPANY_ADDRESS}. Information Officer: {email}.
      </p>
    </LegalPage>
  );
}
