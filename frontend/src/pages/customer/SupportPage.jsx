import { useEffect, useRef, useState } from 'react';
import { Card, Title, Stack, Group, ThemeIcon, Text, ScrollArea, Textarea, ActionIcon, Loader, Center } from '@mantine/core';
import { IconHeadset, IconSend } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { myMessages, sendMyMessage, markMyRead } from '../../services/supportService';

const POLL_INTERVAL = 4000;

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function SupportPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const viewportRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const load = async (isFirstLoad) => {
    try {
      const res = await myMessages();
      setMessages(res.messages);
      if (isFirstLoad) scrollToBottom();
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    markMyRead();
    const interval = setInterval(() => load(false), POLL_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
      markMyRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const res = await sendMyMessage(trimmed);
      setMessages((prev) => [...prev, res.message]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Stack h="calc(100vh - 120px)">
      <Group gap="xs">
        <ThemeIcon size={34} radius="md" variant="light" color="blue">
          <IconHeadset size={19} />
        </ThemeIcon>
        <Title order={2}>Support</Title>
      </Group>

      <Card p={0} withBorder radius="md" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ScrollArea style={{ flex: 1 }} p="md" viewportRef={viewportRef}>
          {loading ? (
            <Center h={200}>
              <Loader size="sm" />
            </Center>
          ) : messages.length === 0 ? (
            <Center h={200}>
              <Text c="dimmed" size="sm">
                No messages yet. Send us a message and our team will get back to you.
              </Text>
            </Center>
          ) : (
            <Stack gap="sm">
              {messages.map((m) => {
                const mine = m.senderRole === 'customer';
                return (
                  <Group key={m._id} justify={mine ? 'flex-end' : 'flex-start'} align="flex-end" gap={8} wrap="nowrap">
                    {!mine && (
                      <ThemeIcon size={26} radius="xl" variant="light" color="gold" style={{ flexShrink: 0 }}>
                        <IconHeadset size={14} />
                      </ThemeIcon>
                    )}
                    <div
                      style={{
                        maxWidth: '72%',
                        padding: '8px 12px',
                        borderRadius: 14,
                        background: mine
                          ? 'linear-gradient(135deg, #FFD86B, #D4AF37)'
                          : 'rgba(212, 175, 55, 0.08)',
                        color: mine ? '#1a1408' : 'inherit',
                        borderBottomRightRadius: mine ? 4 : 14,
                        borderBottomLeftRadius: mine ? 14 : 4,
                      }}
                    >
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {m.message}
                      </Text>
                      <Text size="xs" mt={2} style={{ opacity: 0.65 }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </div>
                    {mine && (
                      <ThemeIcon size={26} radius="xl" variant="filled" color="blue" style={{ flexShrink: 0 }}>
                        <Text size={10} fw={700}>
                          {getInitials(user?.name)}
                        </Text>
                      </ThemeIcon>
                    )}
                  </Group>
                );
              })}
            </Stack>
          )}
        </ScrollArea>

        <Group p="sm" gap="xs" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} wrap="nowrap" align="flex-end">
          <Textarea
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            autosize
            minRows={1}
            maxRows={4}
            style={{ flex: 1 }}
          />
          <ActionIcon size={38} radius="md" variant="filled" color="blue" onClick={handleSend} loading={sending} disabled={!text.trim()}>
            <IconSend size={17} />
          </ActionIcon>
        </Group>
      </Card>
    </Stack>
  );
}
