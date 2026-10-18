export const subscriptionStatuses = ["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"];
export class DomainError extends Error {
}
const transitions = {
    ACTIVE: ["PAST_DUE", "CANCELLED"],
    PAST_DUE: ["ACTIVE", "EXPIRED", "CANCELLED"],
    CANCELLED: [],
    EXPIRED: [],
};
export function transition(subscription, next) {
    if (!transitions[subscription.status].includes(next)) {
        throw new DomainError(`Transition ${subscription.status} → ${next} is forbidden`);
    }
    return { ...subscription, status: next };
}
// Failed payment attempts do not immediately revoke an already paid period.
export function markPastDue(subscription, now) {
    const next = transition(subscription, "PAST_DUE");
    return { ...next, gracePeriodEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) };
}
