import { H, LegalPage, P } from '../src/components/LegalPage';
import { GRIEVANCE_EMAIL } from '../src/config/site';

// DRAFT: needs legal review before launch.
export default function Terms() {
  return (
    <LegalPage title="Terms">
      <P>Draft for review. By using Somudai you agree to these terms.</P>
      <H>One person, one account</H>
      <P>Every number on Somudai is a real person. Use one account, and don't Tap on someone else's behalf or with automated tools.</P>
      <H>What a Tap means</H>
      <P>"I'm joining" means you plan to join an action. "I stand with this" means you support a stance. Neither is a record that you attended anything.</P>
      <H>Content</H>
      <P>Posts are added by the Somudai team and verified organisers. Somudai hosts civic and political matters but does not take sides.</P>
      <H>Contact</H>
      <P>Write to {GRIEVANCE_EMAIL}.</P>
    </LegalPage>
  );
}
