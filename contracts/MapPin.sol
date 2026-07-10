// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MapPin {
    uint256 public nextPinId = 1;

    struct Pin {
        address maker;
        string place;
        string terrain;
        string mood;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => Pin) private pins;

    event PinDropped(uint256 indexed pinId, address indexed maker, string place, string terrain);

    function dropPin(
        string calldata place,
        string calldata terrain,
        string calldata mood,
        string calldata note
    ) external returns (uint256 pinId) {
        require(bytes(place).length > 0 && bytes(place).length <= 48, "Invalid place");
        require(bytes(terrain).length > 0 && bytes(terrain).length <= 24, "Invalid terrain");
        require(bytes(mood).length > 0 && bytes(mood).length <= 24, "Invalid mood");
        require(bytes(note).length > 0 && bytes(note).length <= 140, "Invalid note");

        pinId = nextPinId++;
        pins[pinId] = Pin({
            maker: msg.sender,
            place: place,
            terrain: terrain,
            mood: mood,
            note: note,
            createdAt: block.timestamp
        });

        emit PinDropped(pinId, msg.sender, place, terrain);
    }

    function getPin(
        uint256 pinId
    )
        external
        view
        returns (
            address maker,
            string memory place,
            string memory terrain,
            string memory mood,
            string memory note,
            uint256 createdAt
        )
    {
        Pin storage pin = pins[pinId];
        return (pin.maker, pin.place, pin.terrain, pin.mood, pin.note, pin.createdAt);
    }
}
