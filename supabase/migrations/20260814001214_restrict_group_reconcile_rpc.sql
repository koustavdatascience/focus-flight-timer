-- Reconciliation is an internal transition used by the authenticated heartbeat
-- and readiness RPCs. Clients never need to invoke it directly.
revoke execute on function public.reconcile_group_flight(uuid) from authenticated;
