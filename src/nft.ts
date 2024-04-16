import { BigInt, store, log } from "@graphprotocol/graph-ts";
import {
  Approval as ApprovalERC721,
  ApprovalForAll,
} from "../generated/nft/IERC721";
import { TokenType, ensureAccount, ensureToken } from "./helper";
import { TokenApproval } from "../generated/schema";

//TODO: individual token IDs approvals
export function handleApproval(event: ApprovalERC721): void {
  const owner = ensureAccount(event.params.owner)
  const token = ensureToken(event.address)
  const spender = event.params.approved

  if (!owner || !spender) {
    return;
  }

  const approveId = `${token.type}Approve-${token.id}-${owner.id}-${spender.toHexString()}`;

  // log.warning("DBG token: {} approved: {} ID: {} tx: {}", [token.id, event.params.approved.toHexString(), event.params.tokenId.toHexString(), event.transaction.hash.toHexString()])
  let approve = TokenApproval.load(approveId);

  // let ids = new Array<BigInt>();

  if (!approve) {
    approve = new TokenApproval(approveId);
    approve.token = token.id;
    approve.owner = owner.id;
    approve.spender = spender;
    approve.isAll = false;
    // approve.tokenIds = ids;
  }
  // ids = approve.tokenIds
  // if (
  //   spender.toHexString() ==
  //   "0x0000000000000000000000000000000000000000"
  // ) {
  //   const removeIndex = ids.indexOf(event.params.tokenId);
  //   if (removeIndex >= 0) ids.splice(removeIndex, 1)
  //   log.warning("DBG approve removing: {}", [token.id])
  // } else {
  //   ids.push(event.params.tokenId)
  // }

  // approve.tokenIds = ids
  approve.amount = BigInt.fromI32(0);
  approve.save();
}

export function handleApprovalForAll(event: ApprovalForAll): void {
  const owner = ensureAccount(event.params.owner)
  const spender = event.params.operator
  const token = ensureToken(event.address)

  if (!owner || !spender) {
    return;
  }

  const approveId = `${token.type}Approve-${token.id}-${owner.id}-${spender.toHexString()}`;

  let approve = TokenApproval.load(approveId);
  if (!event.params.approved) {
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
    approve.isAll = true;
    // approve.tokenIds = new Array<BigInt>();
  }

  
  approve.save();
}