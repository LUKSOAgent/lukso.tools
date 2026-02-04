// File: contracts/ILSP7DigitalAsset.sol

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

/**
 * @title Interface of the LSP7 - Digital Asset standard, a fungible digital asset.
 */
interface ILSP7DigitalAsset {
    // --- Events

    /**
     * @dev Emitted when the `from` transferred successfully `amount` of tokens to `to`.
     * @param operator The address of the operator that executed the transfer.
     * @param from The address which tokens were sent from (balance decreased by `-amount`).
     * @param to The address that received the tokens (balance increased by `+amount`).
     * @param amount The amount of tokens transferred.
     * @param force if the transferred enforced the `to` recipient address to be a contract that implements the LSP1 standard or not.
     * @param data Any additional data included by the caller during the transfer, and sent in the LSP1 hooks to the `from` and `to` addresses.
     */
    event Transfer(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 amount,
        bool force,
        bytes data
    );

    /**
     * @dev Emitted when `tokenOwner` enables `operator` for `amount` tokens.
     * @param operator The address authorized as an operator
     * @param tokenOwner The token owner
     * @param amount The amount of tokens `operator` address has access to from `tokenOwner`
     * @param operatorNotificationData The data to notify the operator about via LSP1.
     */
    event OperatorAuthorizationChanged(
        address indexed operator,
        address indexed tokenOwner,
        uint256 indexed amount,
        bytes operatorNotificationData
    );

    /**
     * @dev Emitted when `tokenOwner` disables `operator` for `amount` tokens and set its {`authorizedAmountFor(...)`} to `0`.
     * @param operator The address revoked from operating
     * @param tokenOwner The token owner
     * @param notified Bool indicating whether the operator has been notified or not
     * @param operatorNotificationData The data to notify the operator about via LSP1.
     */
    event OperatorRevoked(
        address indexed operator,
        address indexed tokenOwner,
        bool indexed notified,
        bytes operatorNotificationData
    );

    // --- Token queries

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * If the asset contract has been set to be non-divisible via the `isNonDivisible_` parameter in
     * the `constructor`, the decimals returned will be `0`. Otherwise `18` is the common value.
     *
     * @custom:notice This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {balanceOf} and {transfer}.
     *
     * @return the number of decimals. If `0` is returned, the asset is non-divisible.
     */
    function decimals() external view returns (uint8);

    /**
     * @dev Returns the number of existing tokens that have been minted in this contract.
     * @return The number of existing tokens.
     */
    function totalSupply() external view returns (uint256);

    // --- Token owner queries

    /**
     * @dev Get the number of tokens owned by `tokenOwner`.
     * If the token is divisible (the {decimals} function returns `18`), the amount returned should be divided
     * by 1e18 to get a better picture of the actual balance of the `tokenOwner`.
     *
     * _Example:_
     *
     * ```
     * balanceOf(someAddress) -> 42_000_000_000_000_000_000 / 1e18 = 42 tokens
     * ```
     *
     * @param tokenOwner The address of the token holder to query the balance for.
     * @return The amount of tokens owned by `tokenOwner`.
     */
    function balanceOf(address tokenOwner) external view returns (uint256);

    // --- Operator functionality

    /**
     * @dev Sets an `amount` of tokens that an `operator` has access from the caller's balance (allowance). See {authorizedAmountFor}.
     * Notify the operator based on the LSP1-UniversalReceiver standard
     *
     * @param operator The address to authorize as an operator.
     * @param amount The allowance amount of tokens operator has access to.
     * @param operatorNotificationData The data to notify the operator about via LSP1.
     *
     * @custom:requirements
     * - `operator` cannot be the zero address.
     *
     * @custom:events {OperatorAuthorizationChanged} when allowance is given to a new operator or
     * an existing operator's allowance is updated.
     */
    function authorizeOperator(
        address operator,
        uint256 amount,
        bytes memory operatorNotificationData
    ) external;

    /**
     * @dev Enables `tokenOwner` to remove `operator` for its tokens, disallowing it to send any amount of tokens on its behalf.
     * This function also allows the `operator` to remove itself if it is the caller of this function
     *
     * @param operator The address to revoke as an operator.
     * @param tokenOwner The address of the token owner.
     * @param notify Boolean indicating whether to notify the operator or not.
     * @param operatorNotificationData The data to notify the operator about via LSP1.
     *
     * @custom:requirements
     * - caller MUST be `operator` or `tokenOwner`
     * - `operator` cannot be the zero address.
     *
     * @custom:events {OperatorRevoked} event with address of the operator being revoked for the caller (token holder).
     */
    function revokeOperator(
        address operator,
        address tokenOwner,
        bool notify,
        bytes memory operatorNotificationData
    ) external;

    /**
     * @custom:info This function in the LSP7 contract can be used as a prevention mechanism
     * against double spending allowance vulnerability.
     *
     * @notice Increase the allowance of `operator` by +`addedAmount`
     *
     * @dev Atomically increases the allowance granted to `operator` by the caller.
     * This is an alternative approach to {authorizeOperator} that can be used as a mitigation
     * for the double spending allowance problem.
     * Notify the operator based on the LSP1-UniversalReceiver standard
     *
     * @param operator The operator to increase the allowance for `msg.sender`
     * @param addedAmount The additional amount to add on top of the current operator's allowance
     *
     * @custom:requirements
     *  - `operator` cannot be the same address as `msg.sender`
     *  - `operator` cannot be the zero address.
     *
     * @custom:events {OperatorAuthorizationChanged} indicating the updated allowance
     */
    function increaseAllowance(
        address operator,
        uint256 addedAmount,
        bytes memory operatorNotificationData
    ) external;

    /**
     * @custom:info This function in the LSP7 contract can be used as a prevention mechanism
     * against the double spending allowance vulnerability.
     *
     * @notice Decrease the allowance of `operator` by -`subtractedAmount`
     *
     * @dev Atomically decreases the allowance granted to `operator` by the caller.
     * This is an alternative approach to {authorizeOperator} that can be used as a mitigation
     * for the double spending allowance problem.
     * Notify the operator based on the LSP1-UniversalReceiver standard
     *
     * @custom:events
     *  - {OperatorAuthorizationChanged} event indicating the updated allowance after decreasing it.
     *  - {OperatorRevoked} event if `subtractedAmount` is the full allowance,
     *    indicating `operator` does not have any alauthorizedAmountForlowance left for `msg.sender`.
     *
     * @param operator The operator to decrease allowance for `msg.sender`
     * @param tokenOwner The address of the token owner.
     * @param subtractedAmount The amount to decrease by in the operator's allowance.
     *
     * @custom:requirements
     *  - `operator` cannot be the zero address.
     *  - `operator` must have allowance for the caller of at least `subtractedAmount`.
     */
    function decreaseAllowance(
        address operator,
        address tokenOwner,
        uint256 subtractedAmount,
        bytes memory operatorNotificationData
    ) external;

    /**
     * @dev Get the amount of tokens `operator` address has access to from `tokenOwner`.
     * Operators can send and burn tokens on behalf of their owners.
     *
     * @param operator The operator's address to query the authorized amount for.
     * @param tokenOwner The token owner that `operator` has allowance on.
     *
     * @return The amount of tokens the `operator`'s address has access on the `tokenOwner`'s balance.
     *
     * @custom:info If this function is called with the same address for `operator` and `tokenOwner`, it will simply read the `tokenOwner`'s balance
     * (since a tokenOwner is its own operator).
     */
    function authorizedAmountFor(
        address operator,
        address tokenOwner
    ) external view returns (uint256);

    /**
     * @dev Returns all `operator` addresses that are allowed to transfer or burn on behalf of `tokenOwner`.
     *
     * @param tokenOwner The token owner to get the operators for.
     * @return An array of operators allowed to transfer or burn tokens on behalf of `tokenOwner`.
     */
    function getOperatorsOf(
        address tokenOwner
    ) external view returns (address[] memory);

    // --- Transfer functionality

    /**
     * @dev Transfers an `amount` of tokens from the `from` address to the `to` address and notify both sender and recipients via the LSP1 {`universalReceiver(...)`} function.
     * If the tokens are transferred by an operator on behalf of a token holder, the allowance for the operator will be decreased by `amount` once the token transfer
     * has been completed (See {authorizedAmountFor}).
     *
     * @param from The sender address.
     * @param to The recipient address.
     * @param amount The amount of tokens to transfer.
     * @param force When set to `true`, the `to` address CAN be any address. When set to `false`, the `to` address MUST be a contract that supports the LSP1 UniversalReceiver standard.
     * @param data Any additional data the caller wants included in the emitted event, and sent in the hooks of the `from` and `to` addresses.
     *
     * @custom:requirements
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `from` and `to` cannot be the same address (`from` cannot send tokens to itself).
     * - `from` MUST have a balance of at least `amount` tokens.
     * - If the caller is not `from`, it must be an operator for `from` with an allowance of at least `amount` of tokens.
     *
     * @custom:events
     * - {Transfer} event when tokens get successfully transferred.
     * - if the transfer is triggered by an operator, either the {OperatorAuthorizationChanged} event will be emitted with the updated allowance or the {OperatorRevoked}
     * event will be emitted if the operator has no more allowance left.
     *
     * @custom:hint The `force` parameter **MUST be set to `true`** to transfer tokens to Externally Owned Accounts (EOAs)
     * or contracts that do not implement the LSP1 Universal Receiver Standard. Otherwise the function will revert making the transfer fail.
     *
     * @custom:info if the `to` address is a contract that implements LSP1, it will always be notified via its `universalReceiver(...)` function, regardless if `force` is set to `true` or `false`.
     *
     * @custom:info Note that token transfers revert when no allowance is given, including when the `amount` is `0`.
     * This is to prevent this function from being used maliciously, such as performing zero-value token transfer phishing attacks.
     *
     * @custom:warning Be aware that when either the sender or the recipient can have logic that revert in their `universalReceiver(...)` function when being notified.
     * This even if the `force` was set to `true`.
     */
    function transfer(
        address from,
        address to,
        uint256 amount,
        bool force,
        bytes memory data
    ) external;

    /**
     * @dev Same as {`transfer(...)`} but transfer multiple tokens based on the arrays of `from`, `to`, `amount`.
     *
     * @custom:info If any transfer in the batch fail or revert, the whole call will revert.
     *
     * @param from An array of sending addresses.
     * @param to An array of receiving addresses.
     * @param amount An array of amount of tokens to transfer for each `from -> to` transfer.
     * @param force For each transfer, when set to `true`, the `to` address CAN be any address. When set to `false`, the `to` address MUST be a contract that supports the LSP1 UniversalReceiver standard.
     * @param data An array of additional data the caller wants included in the emitted event, and sent in the hooks to `from` and `to` addresses.
     *
     * @custom:requirements
     * - `from`, `to`, `amount` lists MUST be of the same length.
     * - no values in `from` can be the zero address.
     * - no values in `to` can be the zero address.
     * - each `amount` tokens MUST be owned by `from`.
     * - for each transfer, if the caller is not `from`, it MUST be an operator for `from` with access to at least `amount` tokens.
     *
     * @custom:events {Transfer} event **for each token transfer**.
     */
    function transferBatch(
        address[] memory from,
        address[] memory to,
        uint256[] memory amount,
        bool[] memory force,
        bytes[] memory data
    ) external;

    /**
     * @notice Executing the following batch of abi-encoded function calls on the contract: `data`.
     *
     * @dev Allows a caller to batch different function calls in one call. Perform a `delegatecall` on self, to call different functions with preserving the context.
     * @param data An array of ABI encoded function calls to be called on the contract.
     * @return results An array of abi-encoded data returned by the functions executed.
     */
    function batchCalls(
        bytes[] calldata data
    ) external returns (bytes[] memory results);
}

// File: contracts/presets/ILSP7Mintable.sol

// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.4;

// interfaces

/**
 * @dev LSP7 extension, Mintable version.
 */
interface ILSP7Mintable is ILSP7DigitalAsset {
    /**
     * @param to The address to mint tokens
     * @param amount The amount to mint
     * @param force When set to TRUE, to may be any address but
     * when set to FALSE to must be a contract that supports LSP1 UniversalReceiver
     * @param data Additional data the caller wants included in the emitted event, and sent in the hooks to `from` and `to` addresses.
     * @dev Mints `amount` tokens and transfers it to `to`.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     *
     * Emits a {Transfer} event.
     */
    function mint(
        address to,
        uint256 amount,
        bool force,
        bytes memory data
    ) external;
}

// File: @lukso/lsp1-contracts/contracts/ILSP1UniversalReceiver.sol

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

/**
 * @title Interface of the LSP1 - Universal Receiver standard, an entry function for a contract to receive arbitrary information.
 * @dev LSP1UniversalReceiver allows to receive arbitrary messages and to be informed when assets are sent or received.
 */
interface ILSP1UniversalReceiver {
    /**
     * @dev Emitted when the {universalReceiver} function was called with a specific `typeId` and some `receivedData`
     * @notice Address `from` called the `universalReceiver(...)` function while sending `value` LYX. Notification type (typeId): `typeId` - Data received: `receivedData`.
     *
     * @param from The address of the EOA or smart contract that called the {universalReceiver(...)} function.
     * @param value The amount sent to the {universalReceiver(...)} function.
     * @param typeId A `bytes32` unique identifier (= _"hook"_) that describe the type of notification, information or transaction received by the contract. Can be related to a specific standard or a hook.
     * @param receivedData Any arbitrary data that was sent to the {universalReceiver(...)} function.
     * @param returnedValue The value returned by the {universalReceiver(...)} function.
     */
    event UniversalReceiver(
        address indexed from,
        uint256 indexed value,
        bytes32 indexed typeId,
        bytes receivedData,
        bytes returnedValue
    );

    /**
     * @dev Generic function that can be used to notify the contract about specific incoming transactions or events like asset transfers, vault transfers, etc. Allows for custom on-chain and off-chain reactions based on the `typeId` and `data`.
     * @notice Reacted on received notification with `typeId` & `data`.
     *
     * @param typeId The hash of a specific standard or a hook.
     * @param data The arbitrary data received with the call.
     *
     * @custom:events {UniversalReceiver} event.
     */
    function universalReceiver(
        bytes32 typeId,
        bytes calldata data
    ) external payable returns (bytes memory);
}

// File: @openzeppelin/contracts/utils/structs/EnumerableSet.sol

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/structs/EnumerableSet.sol)
// This file was procedurally generated from scripts/generate/templates/EnumerableSet.js.

pragma solidity ^0.8.0;

/**
 * @dev Library for managing
 * https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
 * types.
 *
 * Sets have the following properties:
 *
 * - Elements are added, removed, and checked for existence in constant time
 * (O(1)).
 * - Elements are enumerated in O(n). No guarantees are made on the ordering.
 *
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using EnumerableSet for EnumerableSet.AddressSet;
 *
 *     // Declare a set state variable
 *     EnumerableSet.AddressSet private mySet;
 * }
 * ```
 *
 * As of v3.3.0, sets of type `bytes32` (`Bytes32Set`), `address` (`AddressSet`)
 * and `uint256` (`UintSet`) are supported.
 *
 * [WARNING]
 * ====
 * Trying to delete such a structure from storage will likely result in data corruption, rendering the structure
 * unusable.
 * See https://github.com/ethereum/solidity/pull/11843[ethereum/solidity#11843] for more info.
 *
 * In order to clean an EnumerableSet, you can either remove all elements one by one or create a fresh instance using an
 * array of EnumerableSet.
 * ====
 */
library EnumerableSet {
    // To implement this library for multiple types with as little code
    // repetition as possible, we write it in terms of a generic Set type with
    // bytes32 values.
    // The Set implementation uses private functions, and user-facing
    // implementations (such as AddressSet) are just wrappers around the
    // underlying Set.
    // This means that we can only create new EnumerableSets for types that fit
    // in bytes32.

    struct Set {
        // Storage of set values
        bytes32[] _values;
        // Position of the value in the `values` array, plus 1 because index 0
        // means a value is not in the set.
        mapping(bytes32 => uint256) _indexes;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function _add(Set storage set, bytes32 value) private returns (bool) {
        if (!_contains(set, value)) {
            set._values.push(value);
            // The value is stored at length-1, but we add 1 to all indexes
            // and use 0 as a sentinel value
            set._indexes[value] = set._values.length;
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function _remove(Set storage set, bytes32 value) private returns (bool) {
        // We read and store the value's index to prevent multiple reads from the same storage slot
        uint256 valueIndex = set._indexes[value];

        if (valueIndex != 0) {
            // Equivalent to contains(set, value)
            // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
            // the array, and then remove the last element (sometimes called as 'swap and pop').
            // This modifies the order of the array, as noted in {at}.

            uint256 toDeleteIndex = valueIndex - 1;
            uint256 lastIndex = set._values.length - 1;

            if (lastIndex != toDeleteIndex) {
                bytes32 lastValue = set._values[lastIndex];

                // Move the last value to the index where the value to delete is
                set._values[toDeleteIndex] = lastValue;
                // Update the index for the moved value
                set._indexes[lastValue] = valueIndex; // Replace lastValue's index to valueIndex
            }

            // Delete the slot where the moved value was stored
            set._values.pop();

            // Delete the index for the deleted slot
            delete set._indexes[value];

            return true;
        } else {
            return false;
