import { Address, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { Account, Token, TokenApproval } from "../generated/schema";
import { IERC165 } from "../generated/token/IERC165";
import { IERC20 } from "../generated/token/IERC20";
import { IERC721 } from "../generated/nft/IERC721";

export const ERC721_INTERFACE_IDENTIFIER = "0x80ac58cd";
export const ERC1155_INTERFACE_IDENTIFIER = "0xd9b67a26";

export namespace TokenType {
  export const ERC20 = "ERC20";
  export const ERC721 = "ERC721";
  export const ERC1155 = "ERC1155";
  export const UNKNOWN = "UNKNOWN";
}

const zeroAddress = '0x0000000000000000000000000000000000000000';

export const ensureAccount = (address: Address): Account | null => {
  let account = Account.load(address.toHexString());

  if (!account) {
    account = new Account(address.toHexString());
    account.save();
  }
  return account;
}

export const ensureToken = (id: Address, tokenType: string | null = null): Token => {
  let token = Token.load(id.toHexString());

  if (!token) {
    let name: ethereum.CallResult<string>;
    let symbol: ethereum.CallResult<string>;

    token = new Token(id.toHexString());

    if (tokenType === TokenType.ERC20) {
      token.type = TokenType.ERC20
      let instance = IERC20.bind(id)
      name = instance.try_name();
      symbol = instance.try_symbol();

      if (!name.reverted) {
        token.name = name.value;
      }

      if (!symbol.reverted) {
        token.symbol = symbol.value;
      }

      let decimals = instance.try_decimals();
      token.decimals = decimals.reverted ? 18 : decimals.value;
    } else {
      token.type = getNftStandard(id.toHexString())
      
      // nasty hardcode
      // if (id.toHexString() == '0x02286d77425ae3287335ff28b264109225ed6991') {
      //   token.name = 'CyberKongz VX: Gear'
      // } else if (id.toHexString() == '0x9467ed740f52437ba7eaf65e29354ef0f7a8855d') {
      //   token.name = 'CyberKongz PnK: Consumables'
      // } else {
        let instance = IERC721.bind(id)
        name = instance.try_name();
        symbol = instance.try_symbol();
        if (!name.reverted) {
          token.name = name.value;
        }
        if (!symbol.reverted) {
          token.symbol = symbol.value;
        }
      // }
      token.decimals = 0
    }
    token.save();
  }

  return token;
};

export const ensureApproval = (id: Address): TokenApproval => {
  let approval = TokenApproval.load(id.toHexString());

  if (!approval) {
    approval = new TokenApproval(id.toHexString());
    approval.save();
  }

  return approval;
};

function getNftStandard(collectionID: string): string {
  const erc165 = IERC165.bind(Address.fromString(collectionID));

  const isERC721Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC721_INTERFACE_IDENTIFIER)
  );
  if (isERC721Result.reverted) {
    log.warning("[getNftStandard] isERC721 reverted", []);
  } else {
    if (isERC721Result.value) {
      return TokenType.ERC721;
    }
  }

  const isERC1155Result = erc165.try_supportsInterface(
    Bytes.fromHexString(ERC1155_INTERFACE_IDENTIFIER)
  );
  if (isERC1155Result.reverted) {
    log.warning("[getNftStandard] isERC1155 reverted", []);
  } else {
    if (isERC1155Result.value) {
      return TokenType.ERC1155;
    }
  }

  return TokenType.UNKNOWN;
}