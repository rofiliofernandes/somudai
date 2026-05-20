import { Linking } from 'react-native';
import { Button } from '../src/components';
import { LegalPage, P } from '../src/components/LegalPage';
import { GRIEVANCE_EMAIL } from '../src/config/site';

export default function Contact() {
  return (
    <LegalPage title="Contact">
      <P>For questions, complaints or anything about your data, write to our grievance officer at {GRIEVANCE_EMAIL}.</P>
      <Button label="Email us" variant="secondary" onPress={() => Linking.openURL(`mailto:${GRIEVANCE_EMAIL}`)} />
    </LegalPage>
  );
}
