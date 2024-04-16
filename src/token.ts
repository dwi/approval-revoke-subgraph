import { BigInt, store } from "@graphprotocol/graph-ts";
import {  Approval as ApprovalERC20 } from "../generated/token/IERC20";
import { TokenApproval } from "../generated/schema";
import { TokenType, ensureAccount, ensureToken } from "./helper";

export function handleApproval(event: ApprovalERC20): void {
  const owner = ensureAccount(event.params.owner)
  const spender = event.params.spender
  const token = ensureToken(event.address, TokenType.ERC20)
  const amount = event.params.value

  if (!owner || !spender) {
    return;
  }

  const approveId = `ERC20Approve-${token.id}-${owner.id}-${spender.toHexString()}`;

  let approve = TokenApproval.load(approveId);

  if (amount.equals(BigInt.fromU32(0))) {
    if (approve) {
      store.remove("TokenApproval", approveId);
    }
    return;
  }

  if (!approve) {
    approve = new TokenApproval(approveId);
    approve.token = token.id;
    approve.owner = owner.id;
    approve.spender = spender;
    approve.isAll = false;
    // approve.tokenIds = new Array<BigInt>();
  }
  approve.amount = amount;
  approve.save();
}

