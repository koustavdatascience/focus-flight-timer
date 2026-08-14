-- Social writes and social overviews must never be reachable by anonymous visitors.
-- get_focusflight_profile remains intentionally anonymous-readable because it exposes
-- only the function's privacy-filtered result for public profile routes.

revoke execute on function public.get_focusflight_social_overview() from anon;
revoke execute on function public.send_focusflight_friend_request(uuid) from anon;
revoke execute on function public.respond_to_focusflight_friend_request(uuid, boolean) from anon;
revoke execute on function public.cancel_focusflight_friend_request(uuid) from anon;
revoke execute on function public.block_focusflight_user(uuid) from anon;
revoke execute on function public.unblock_focusflight_user(uuid) from anon;

grant execute on function public.get_focusflight_social_overview() to authenticated;
grant execute on function public.send_focusflight_friend_request(uuid) to authenticated;
grant execute on function public.respond_to_focusflight_friend_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_focusflight_friend_request(uuid) to authenticated;
grant execute on function public.block_focusflight_user(uuid) to authenticated;
grant execute on function public.unblock_focusflight_user(uuid) to authenticated;
