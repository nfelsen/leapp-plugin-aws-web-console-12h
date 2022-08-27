import { Session } from "@noovolari/leapp-core/models/session";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";
import { PluginLogLevel } from "@noovolari/leapp-core/plugin-sdk/plugin-log-level";

export class AwsWebConsole12 extends AwsCredentialsPlugin {
  get actionName(): string {
    return "AWS sessions that last 12h";
  }

  /*
   * Get your icon here: 
   * https://fontawesome.com/v5/search
   */
  get actionIcon(): string {
    return "fas fa-clock";
  }

  /*
   * @params
   * session       Session            my session object (https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/session.ts)
   * credentials   Credential-Info    my credentials object (https://github.com/Noovolari/leapp/blob/master/packages/core/src/models/credentials-info.ts)
   */
  async applySessionAction(session: Session, credentials: any): Promise<void> {
    this.pluginEnvironment.log("Opening web console for session: " + session.sessionName, PluginLogLevel.info, true);

    const secondsInAHour = 3600;
    const sessionDurationInHours = 12;
    const sessionRegion = session.region;
    const sessionDuration =  sessionDurationInHours * secondsInAHour
    const isUSGovCloud = sessionRegion.startsWith("us-gov-");
    let federationUrl;
    let consoleHomeURL;

    if (!isUSGovCloud) {
      federationUrl = "https://signin.aws.amazon.com/federation";
      consoleHomeURL = `https://${sessionRegion}.console.aws.amazon.com/console/home?region=${sessionRegion}`;
    } else {
      federationUrl = "https://signin.amazonaws-us-gov.com/federation";
      consoleHomeURL = `https://console.amazonaws-us-gov.com/console/home?region=${sessionRegion}`;
    }

    if (sessionRegion.startsWith("cn-")) {
      throw new Error("Unsupported Region");
    }

    this.pluginEnvironment.log("Starting opening Web Console", PluginLogLevel.info, true);

    const sessionStringJSON = {
      sessionId: credentials.sessionToken.aws_access_key_id,
      sessionKey: credentials.sessionToken.aws_secret_access_key,
      sessionToken: credentials.sessionToken.aws_session_token,
    };

    const queryParametersSigninToken = `?Action=getSigninToken&SessionDuration=${sessionDuration}&Session=${encodeURIComponent(
      JSON.stringify(sessionStringJSON)
    )}`;

    const res = await this.pluginEnvironment.fetch(`${federationUrl}${queryParametersSigninToken}`);
    const response = await res.json();

    const loginURL = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${(response as any).SigninToken}`;
    this.pluginEnvironment.openExternalUrl(loginURL);
  }
}
