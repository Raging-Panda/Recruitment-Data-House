import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { COMPANY_ADDRESS, COMPANY_NAME, LEGAL_EMAIL } from "@/lib/legal";

export const metadata = {
  title: "Terms of Service — IPSkill",
  description: "The rules for using IPSkill, for developers and recruiters.",
};

export default function TermsPage() {
  const email = <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>;

  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <>
          These terms are an agreement between you and {COMPANY_NAME}, {COMPANY_ADDRESS}, which runs IPSkill. By
          signing in or using IPSkill you accept them. Our <Link href="/privacy">Privacy Policy</Link> explains how we
          handle your personal information.
        </>
      }
    >
      <h2>1. Who can use IPSkill</h2>
      <p>
        You must be 18 or older. Each account is for one person, and you are responsible for what happens on it. Keep
        the GitHub, Google or LinkedIn account you sign in with secure.
      </p>

      <h2>2. Your content</h2>
      <p>
        You own what you add to IPSkill: your profile text, work history, certifications, project descriptions,
        messages and so on. You give us permission to store it, show it to the people your settings allow (see section
        4 of the <Link href="/privacy">Privacy Policy</Link>) and copy it as needed to run IPSkill. That permission
        ends when you delete the content or your account.
      </p>
      <p>
        What you add must be true and yours to share. Don&apos;t claim jobs, qualifications or work you don&apos;t
        have, and don&apos;t post anything unlawful or anyone else&apos;s private information.
      </p>

      <h2>3. Scores and skill fingerprints</h2>
      <p>
        Your skill fingerprint and scores are automated estimates calculated from public GitHub data and what you
        enter. They are a starting point, not a certification, and we don&apos;t guarantee they are accurate or
        complete. Recruiters should make their own assessment before making decisions about anyone.
      </p>

      <h2>4. Things you must not do</h2>
      <ul>
        <li>Pretend to be someone else, or create accounts for other people.</li>
        <li>Harass, spam or mislead anyone, including through messages or interview requests.</li>
        <li>Game your scores, share skill test questions or answers, or let someone else take a test for you.</li>
        <li>Scrape, copy or bulk-download profiles, or use IPSkill to build another service.</li>
        <li>Try to get around access limits, break our security, or interfere with how IPSkill runs.</li>
      </ul>

      <h2>5. Recruiters</h2>
      <p>If we give you access to Recruiter Tools:</p>
      <ul>
        <li>use what you see only to recruit for real roles, and only contact developers about those roles;</li>
        <li>
          don&apos;t export, sell or share developers&apos; information outside your hiring process, and handle it as
          POPIA (and any other law that applies to you) requires;
        </li>
        <li>be honest about who you are, who you recruit for and the role.</li>
      </ul>
      <p>We decide who gets recruiter access and can withdraw it if these rules are broken.</p>

      <h2>6. Plans and payment</h2>
      <p>
        IPSkill is free for developers. Paid plans are invite-only at the moment and are granted by us. If we start
        charging, we will show you the price and payment terms before you pay anything, and nothing in these terms
        lets us charge you without your agreement.
      </p>

      <h2>7. Changes and availability</h2>
      <p>
        IPSkill is new and will change. We may add, change or remove features, and the service may sometimes be
        unavailable. The demo profile is fictional and read-only.
      </p>

      <h2>8. Ending your account</h2>
      <p>
        You can stop using IPSkill at any time and ask us to delete your account by emailing {email}. We may suspend or
        close an account that breaks these terms or puts other people at risk, and will tell you why unless the law or
        safety prevents it.
      </p>

      <h2>9. Our responsibility to you</h2>
      <p>
        We provide IPSkill with reasonable care and skill, but &quot;as is&quot;: we can&apos;t promise it will
        always be available or error-free, or that it will lead to a job or a hire. As far as the law allows, we are
        not liable for indirect or consequential loss (such as lost income or opportunities), and our total liability
        to you is limited to what you paid us in the 12 months before the claim.
      </p>
      <p>
        Nothing in these terms limits any right you have under the Consumer Protection Act 68 of 2008 or any other
        law that cannot be excluded by agreement.
      </p>

      <h2>10. Other services</h2>
      <p>
        Signing in with GitHub, Google or LinkedIn is also covered by their own terms. We aren&apos;t responsible for
        websites that profiles link to.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        We will update the date at the top whenever these terms change, and tell you in IPSkill before a significant
        change takes effect. If you keep using IPSkill after that, the new terms apply.
      </p>

      <h2>12. Law</h2>
      <p>These terms are governed by the law of the Republic of South Africa, and South African courts can hear any dispute about them.</p>

      <h2>13. Contact</h2>
      <p>
        {COMPANY_NAME}, {COMPANY_ADDRESS}. Email {email}.
      </p>
    </LegalPage>
  );
}
