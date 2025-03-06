import Blob "mo:base/Blob";
import Char "mo:base/Char";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";

module {
  let hex_chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

  public func encode(b : Blob) : Text {
    let bytes = Blob.toArray(b);
    Array.foldRight(
      bytes,
      "",
      func(n : Nat8, acc : Text) : Text {
        let a = hex_chars[Nat8.toNat(n) / 16];
        let b = hex_chars[Nat8.toNat(n) % 16];
        a # b # acc;
      },
    );
  };

  public func decode(t : Text) : ?Blob {
    let chars = Text.toArray(Text.toLowercase(t));
    var failed = false;
    let ret = Blob.fromArray(
      Array.tabulate(
        chars.size() / 2,
        func(i : Nat) : Nat8 {
          let a = hex_char_to_nat(chars[i * 2]);
          let b = hex_char_to_nat(chars[i * 2 + 1]);

          switch (a, b) {
            case (?a, ?b) {
              Nat8.fromNat(a * 16 + b);
            };
            case _ {
              failed := true;
              Nat8.fromNat(0);
            };
          };
        },
      )
    );

    if (failed) {
      null;
    } else {
      ?ret;
    };
  };

  func hex_char_to_nat(c : Char) : ?Nat {
    if (c >= '0' and c <= '9') {
      ?Nat32.toNat(Char.toNat32(c) - 48);
    } else if (c >= 'a' and c <= 'f') {
      ?Nat32.toNat(Char.toNat32(c) - 87);
    } else {
      null;
    };
  };
};
