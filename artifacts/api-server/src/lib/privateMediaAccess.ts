export type PrivateMediaViewer = { id: string; isAdmin: boolean } | undefined;

export type PrivateMediaReferences = {
  kycOwnerIds: string[];
  chatParticipants: Array<{ buyerId: string; sellerId: string }>;
  importOwnerIds: string[];
};

export type PrivateMediaAccessDecision = { referenced: boolean; allowed: boolean };

/** Pure relationship policy; database lookup and storage ACLs stay separate. */
export function decidePrivateMediaAccess(
  viewer: PrivateMediaViewer,
  refs: PrivateMediaReferences,
): PrivateMediaAccessDecision {
  const referenced =
    refs.kycOwnerIds.length > 0 ||
    refs.chatParticipants.length > 0 ||
    refs.importOwnerIds.length > 0;
  if (!referenced || !viewer) return { referenced, allowed: false };

  const ownsKyc = refs.kycOwnerIds.includes(viewer.id);
  const isChatParticipant = refs.chatParticipants.some(
    (row) => row.buyerId === viewer.id || row.sellerId === viewer.id,
  );
  const ownsImportDocument = refs.importOwnerIds.includes(viewer.id);
  const adminMayReview =
    viewer.isAdmin && (refs.kycOwnerIds.length > 0 || refs.importOwnerIds.length > 0);

  return {
    referenced: true,
    allowed: ownsKyc || isChatParticipant || ownsImportDocument || adminMayReview,
  };
}
