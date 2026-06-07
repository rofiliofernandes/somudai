import { H, LegalPage, P } from '../src/components/LegalPage';
import { GRIEVANCE_EMAIL } from '../src/config/site';

// DRAFT: plain-language summary of what the app actually does. Have a lawyer
// review it against India's DPDP Act before launch.
export default function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <P>Draft for review. Somudai helps people join and stand with public matters near them. Here is what we keep and why.</P>
      <H>What we keep</H>
      <P>Your sign-in (Google or email), the name and photo Google shares if you use it, your area, the matters you pick, a short bio if you add one, and each post you Tap.</P>
      <H>Who can see it</H>
      <P>Who tapped a post is never shown publicly. Other people only see totals, like "1,284 joined". Your list of Taps is visible only to you.</P>
      <H>What we never do</H>
      <P>We never sell or share your Taps. We never take sides on the matters posted here.</P>
      <H>Measuring use</H>
      <P>We count how Somudai is used (screens opened, posts viewed and tapped) using an anonymous id. We never send your name, email, phone number or location to our analytics or crash-report tools.</P>
      <H>Deleting your account</H>
      <P>Profile → Delete account removes your profile and every Tap. It can't be undone.</P>
      <H>Questions or complaints</H>
      <P>Write to {GRIEVANCE_EMAIL}.</P>
    </LegalPage>
  );
}
