{ inputs, pkgs, ... }:
let
  pre-commit-check = import ./checks/pre-commit-check.nix { inherit inputs pkgs; };
in
pkgs.mkShell {
  packages = [
    pkgs.bun
    pkgs.nodejs_22
  ];

  env = { };

  shellHook = ''
    ${pre-commit-check.shellHook}
  '';
}
