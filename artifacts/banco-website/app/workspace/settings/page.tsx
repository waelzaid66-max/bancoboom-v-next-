import { WorkspaceShell } from "../../../components/workspace/WorkspaceShell";
import { AccountSettingsPanel } from "../../../components/workspace/AccountSettingsPanel";

export default function WorkspaceSettingsPage() {
  return (
    <WorkspaceShell>
      <AccountSettingsPanel />
    </WorkspaceShell>
  );
}
