import type { Contract } from 'web3-eth-contract'
import type { ERC721 } from '../../contracts/ERC721'
import { formatChecksumAddress } from '../../plugins/Wallet/formatter'
import { useERC721TokenContract } from '../contracts/useERC721TokenContract'
import { useChainId } from '../hooks/useChainState'
import { useSingleContractMultipleData } from '../hooks/useMulticall'
import { ChainId, ERC721TokenDetailed, EthereumTokenType } from '../types'

const cache = new Map<string, ERC721TokenDetailed | undefined>()
async function ERC721TokenDetailed_(
    chainId: ChainId,
    contract: Contract,
    address: string,
    token?: Partial<ERC721TokenDetailed>,
) {
    // compose calls
    const names = ['name', 'symbol', 'baseURI'] as (keyof ERC721['methods'])[]
    const callDatas = new Array(3).fill([])

    const [results, calls, _, callback] = useSingleContractMultipleData(contract, names, callDatas)

    await callback(calls)

    // compose
    const [name, symbol, baseURI] = results.map((x) => (x.error ? undefined : x.value))
    const token_ = {
        type: EthereumTokenType.ERC721,
        address: formatChecksumAddress(address),
        chainId,
        name: name ?? token?.name ?? '',
        symbol: symbol ?? token?.symbol ?? '',
        baseURI: baseURI ?? token?.baseURI ?? '',
    } as ERC721TokenDetailed
    cache.set(address, token_)
    return
}

export function useAsyncERC721TokenDetailed(address: string, token?: Partial<ERC721TokenDetailed>) {
    const chainId = useChainId()
    const erc721TokenContract = useERC721TokenContract(address) as Contract
    token = cache.get(address)
    if (!token) throw ERC721TokenDetailed_(chainId, erc721TokenContract, address, token)
    return cache.get(address)!
}
