import { CreateOrganization } from '@clerk/nextjs'

export default function CreateOrganizationPage() {
  return (
    <CreateOrganization
      afterCreateOrganizationUrl="/dashboard"   // ★ ここがポイント
      // optional: 招待画面をスキップしたい場合
      // skipInvitationScreen
    />
  )
}
