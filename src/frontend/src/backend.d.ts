import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Generate invite code (admin only)
     */
    generateInviteCode(): Promise<string>;
    /**
     * / Get all RSVPs (admin only)
     */
    getAllRSVPs(): Promise<Array<RSVP>>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get all invite codes (admin only)
     */
    getInviteCodes(): Promise<Array<InviteCode>>;
    /**
     * / Generate invite code (admin only)
     */
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Submit RSVP (public, but requires valid invite code)
     */
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
}
