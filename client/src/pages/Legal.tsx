import { PublicPageLayout } from "./PublicPageLayout";

const ProviderList = () => (
  <ul>
    <li><strong>Supabase</strong> provides account authentication and the application database.</li>
    <li><strong>Vercel</strong> provides web hosting and may process operational request logs.</li>
    <li><strong>OpenStreetMap-based map tiles and Nominatim search</strong> help display maps and resolve place searches. Requests to these services may include technical information such as IP address under their own policies.</li>
  </ul>
);

const LegalContact = () => <a href="mailto:koustavdatascience@gmail.com">koustavdatascience@gmail.com</a>;

export function Privacy() {
  return (
    <PublicPageLayout
      eyebrow="Working policy draft"
      title={<>Privacy, with a clear <em>route.</em></>}
      intro="Last updated 14 August 2026. This plain-language Waypoint working draft must be reviewed by qualified legal counsel before it is relied upon as a final legal policy."
    >
      <article className="legal-document">
        <div className="legal-callout">
          <strong>Important:</strong> Waypoint is a virtual focus-timer project. Selected airports, routes, and current locations in the app are virtual focus data, not physical-location tracking or real travel records.
        </div>

        <h2>1. Information collection</h2>
        <p>Waypoint processes the following information to provide the service:</p>
        <ul>
          <li><strong>Account information.</strong> When someone registers, the service processes an email address and authentication credentials. Passwords are handled by the authentication provider and are not stored by Waypoint in readable form.</li>
          <li><strong>Focus-flight and profile data.</strong> This can include virtual departure and arrival locations, flight duration, completion status, virtual current location, profile fields, privacy preferences, and personal focus statistics.</li>
          <li><strong>Social and feedback data.</strong> Co-Focus rooms, group-flight participation, friendship or blocking choices, leaderboard choices, and signed-in feedback submissions may be processed when those features are used.</li>
          <li><strong>Technical information.</strong> Hosting, map, search, and security providers may process information such as IP address, browser, device, operating-system, and request-log data to deliver and protect the service.</li>
        </ul>

        <h2>2. Information use</h2>
        <p>Waypoint uses this information to provide and maintain the service, personalize the user experience, save virtual focus history, generate personal focus statistics, operate rooms and profile controls, improve features, respond to feedback, communicate important service information, and protect the service against misuse or security risks.</p>

        <h2>3. Information protection</h2>
        <p>Waypoint uses reasonable technical and organizational measures intended to protect information, including encrypted data transmission where supported, secure password handling by the authentication provider, access controls, and periodic security review. No internet service can guarantee absolute security.</p>

        <h2>4. Information sharing</h2>
        <p>Waypoint does not sell or rent personal information. Information may be processed by the service providers listed below, shared with another person only where product visibility settings allow it or the user chooses to share it, disclosed with explicit consent, disclosed when required by law, or used when reasonably necessary to protect the service, users, or legal rights.</p>
        <ProviderList />

        <h2>5. Retention and deletion</h2>
        <p>Waypoint retains information for as long as reasonably necessary to provide the service, maintain security, resolve support issues, and meet applicable legal obligations. An in-app account-deletion workflow is not yet available. A signed-in user may request account or data help by emailing <LegalContact />. Retention periods and the account-deletion process must be confirmed before this draft becomes final.</p>

        <h2>6. Your controls and rights</h2>
        <p>Users can update certain profile, privacy, leaderboard, friendship, and blocking settings in the product. Depending on applicable law, a user may also have rights to access, correct, delete, restrict, object to, or request portability of personal information. Requests can be sent to <LegalContact /> and will be handled in accordance with applicable law once the final policy and operating process are established.</p>

        <h2>7. Updates and contact</h2>
        <p>This draft will be updated when Waypoint&apos;s features, providers, data handling, or legal requirements change. Material changes should carry a revised date and clear notice. Questions or requests about this draft can be sent to <LegalContact />.</p>
      </article>
    </PublicPageLayout>
  );
}

export function Terms() {
  return (
    <PublicPageLayout
      eyebrow="Working terms draft"
      title={<>Terms for a virtual <em>journey.</em></>}
      intro="Last updated 14 August 2026. This working draft describes the current product and requires qualified legal review before it is relied upon as final Terms of Service."
    >
      <article className="legal-document">
        <div className="legal-callout">
          <strong>Virtual by design:</strong> Waypoint is not a flight booking, navigation, aviation, or real-world travel service. Routes, durations, locations, and journey records are part of a virtual productivity experience.
        </div>

        <h2>1. Service description</h2>
        <p>Waypoint is a focus-enhancement web application that supports time management and focus practice through virtual flight experiences. The current product is offered as a free independent project; paid services are not currently offered.</p>

        <h2>2. User responsibilities</h2>
        <p>When using Waypoint, users agree to provide reasonably accurate registration information, protect account credentials, comply with applicable laws, avoid abusing or interfering with the service, and avoid conduct that harms other people&apos;s experience. Users must not attempt unauthorized access, evade blocking controls, use prohibited automation, or harass others through rooms or profiles.</p>

        <h2>3. Service availability</h2>
        <p>Waypoint aims to maintain a reliable service but does not guarantee uninterrupted or error-free availability. Features may be changed, paused, or unavailable because of maintenance, upgrades, provider issues, security measures, or events outside the project&apos;s reasonable control.</p>

        <h2>4. Third-party services and virtual route data</h2>
        <p>Waypoint relies on third-party services for authentication, hosting, maps, and place search. Their services and policies are separate from Waypoint. Map, airport, route, duration, and flight information are provided for a virtual focus experience and must not be treated as real-time aviation, travel, navigation, or booking information.</p>

        <h2>5. Intellectual property</h2>
        <p>The Waypoint name, design, product content, and software are protected as applicable by intellectual-property laws. Users retain rights in information they supply, subject to the permissions reasonably necessary to operate and improve the service. Users may not copy, modify, or distribute protected Waypoint content except where permitted by law or with authorization.</p>

        <h2>6. Disclaimer and limitation of liability</h2>
        <p>To the maximum extent permitted by applicable law, Waypoint is provided on an “as is” and “as available” basis. The project does not guarantee that the service will be error-free, uninterrupted, or suitable for every purpose, and users are responsible for their use of third-party services. Nothing in this working draft excludes liability that cannot lawfully be excluded or limited.</p>

        <h2>7. Suspension or termination</h2>
        <p>Waypoint may restrict, suspend, or terminate access when reasonably necessary to address violations of these terms, fraudulent or unlawful activity, security risks, legal requirements, or service operation. Any final account-termination process must be confirmed by qualified legal counsel.</p>

        <h2>8. Changes to these terms</h2>
        <p>Waypoint may update these terms as the product evolves. Material changes should carry a revised date and clear notice, including by email or in the product where appropriate and technically available. Continued use after an effective update may constitute acceptance where permitted by applicable law.</p>

        <h2>9. Governing law, disputes, and contact</h2>
        <p>The project&apos;s operator jurisdiction, governing law, and final dispute-resolution process have not yet been established and must be completed with qualified legal advice before these terms become final. Questions about this working draft can be sent to <LegalContact />.</p>
      </article>
    </PublicPageLayout>
  );
}
