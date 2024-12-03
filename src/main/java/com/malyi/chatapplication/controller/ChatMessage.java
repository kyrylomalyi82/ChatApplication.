package com.malyi.chatapplication.controller;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatMessage {

    private String message;
    private String sender;
    private MessageType type;

}
