import AccessControl "authorization/access-control";
import InviteLinksModule "invite-links/invite-links-module";
import Random "mo:core/Random";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Array "mo:core/Array";

import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let inviteState = InviteLinksModule.initState();

  public type UserProfile = { name : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Persistent key-value store
  // Keys: "user:{loginCode}", "company:{companyId}", "member:{userId}:{companyId}"
  stable var kvKeys : [Text] = [];
  stable var kvVals : [Text] = [];

  func findIndex(key : Text) : ?Nat {
    var i = 0;
    while (i < kvKeys.size()) {
      if (kvKeys[i] == key) return ?i;
      i += 1;
    };
    null
  };

  func textStartsWith(text : Text, prefix : Text) : Bool {
    if (text.size() < prefix.size()) return false;
    let ti = text.chars();
    for (pc in prefix.chars()) {
      switch (ti.next()) {
        case (?tc) { if (tc != pc) return false; };
        case null { return false; };
      };
    };
    true
  };

  func appendText(arr : [Text], item : Text) : [Text] {
    Array.tabulate(arr.size() + 1, func(i : Nat) : Text {
      if (i < arr.size()) arr[i] else item
    })
  };

  func updateAt(arr : [Text], idx : Nat, item : Text) : [Text] {
    Array.tabulate(arr.size(), func(i : Nat) : Text {
      if (i == idx) item else arr[i]
    })
  };

  /// Set a key-value pair (upsert)
  public func kvSet(key : Text, value : Text) : async () {
    switch (findIndex(key)) {
      case (?i) {
        kvVals := updateAt(kvVals, i, value);
      };
      case null {
        kvKeys := appendText(kvKeys, key);
        kvVals := appendText(kvVals, value);
      };
    };
  };

  /// Get a value by key
  public query func kvGet(key : Text) : async ?Text {
    switch (findIndex(key)) {
      case (?i) { ?kvVals[i] };
      case null { null };
    };
  };

  /// Get all values whose keys start with a given prefix
  public query func kvList(prefix : Text) : async [Text] {
    var result : [Text] = [];
    var i = 0;
    while (i < kvKeys.size()) {
      if (textStartsWith(kvKeys[i], prefix)) {
        result := appendText(result, kvVals[i]);
      };
      i += 1;
    };
    result
  };

  // Existing invite functions

  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    code;
  };

  public shared ({ caller }) func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    InviteLinksModule.getInviteCodes(inviteState);
  };
};
