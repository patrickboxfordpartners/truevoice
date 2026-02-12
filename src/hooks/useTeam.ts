import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeamMembers, updateMemberRole, removeMember, inviteTeamMember } from "@/lib/api/team";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types";

export function useTeam() {
  const { company } = useAuth();
  return useQuery({
    queryKey: ["team", company?.id],
    queryFn: () => getTeamMembers(company!.id),
    enabled: !!company?.id,
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: Role }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  const { company } = useAuth();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: Role }) =>
      inviteTeamMember(email, role, company!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}
