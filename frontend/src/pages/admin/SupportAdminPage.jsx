import { useEffect, useRef, useState } from 'react';
import {
  Card,
  Title,
  Stack,
  Group,
  ThemeIcon,
  Text,
  ScrollArea,
  Textarea,
  ActionIcon,
  Loader,
  Center,
  Badge,
  UnstyledButton,
} from '@mantine/core';
import { IconHeadset, IconSend, IconMessageCircle } from '@tabler/icons-react';
import {
  listConversations,
  getConversation,
  sendAdminMessage,
  markConversationRead,
} from '../../services/supportService';

const LIST_POLL_INTERVAL = 6000;
const MSG_POLL_INTERVAL = 4000;

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function SupportAdminPage() {
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const viewportRef = useRef(null);
  const selectedIdRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const loadConversations = async (isFirstLoad) => {
    try {
      const res = await listConversations();
      setConversations(res.conversations);
    } finally {
      if (isFirstLoad) setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations(true);
    const interval = setInterval(() => loadConversations(false), LIST_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async (customerId, isFirstLoad) => {
    try {
      const res = await getConversation(customerId);
      if (selectedIdRef.current !== customerId) return;
      setMessages(res.messages);
      setSelectedCustomer(res.customer);
      if (isFirstLoad) scrollToBottom();
    } finally {
      if (isFirstLoad) setLoadingMessages(false);
    }
  };

  const openConversation = (customerId) => {
    selectedIdRef.current = customerId;
    setSelectedId(customerId);
    setMessages([]);
    setLoadingMessages(true);
    loadMessages(customerId, true);
    markConversationRead(customerId).then(() => loadConversations(false));
  };

  useEffect(() => {
    if (!selectedId) return undefined;
    const interval = setInterval(() => {
      loadMessages(selectedId, false);
      markConversationRead(selectedId);
    }, MSG_POLL_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    if (!loadingMessages) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !selectedId) return;
    setSending(true);
    setText('');
    try {
      const res = await sendAdminMessage(selectedId, trimmed);
      setMessages((prev) => [...prev, res.message]);
      loadConversations(false);
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
        <Title order={2}>Customer Support</Title>
      </Group>

      <Group align="stretch" gap="md" style={{ flex: 1, overflow: 'hidden' }} wrap="nowrap">
        <Card p={0} withBorder radius="md" w={300} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Group p="sm" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Text size="sm" fw={600}>
              Conversations
            </Text>
          </Group>
          <ScrollArea style={{ flex: 1 }}>
            {loadingList ? (
              <Center h={120}>
                <Loader size="sm" />
              </Center>
            ) : conversations.length === 0 ? (
              <Center h={120}>
                <Text size="sm" c="dimmed">
                  No conversations yet
                </Text>
              </Center>
            ) : (
              conversations.map((c) => (
                <UnstyledButton
                  key={c.customer._id}
                  onClick={() => openConversation(c.customer._id)}
                  p="sm"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: selectedId === c.customer._id ? 'rgba(47, 125, 251, 0.12)' : 'transparent',
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" gap={6}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text size="sm" fw={600} truncate>
                        {c.customer.name}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {c.lastSenderRole === 'admin' ? 'You: ' : ''}
                        {c.lastMessage}
                      </Text>
                    </div>
                    {c.unreadCount > 0 && (
                      <Badge size="sm" color="red" circle>
                        {c.unreadCount}
                      </Badge>
                    )}
                  </Group>
                </UnstyledButton>
              ))
            )}
          </ScrollArea>
        </Card>

        <Card p={0} withBorder radius="md" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedId ? (
            <Center style={{ flex: 1 }}>
              <Stack align="center" gap={6}>
                <ThemeIcon size={44} radius="xl" variant="light" color="gray">
                  <IconMessageCircle size={22} />
                </ThemeIcon>
                <Text c="dimmed" size="sm">
                  Select a conversation to view messages
                </Text>
              </Stack>
            </Center>
          ) : (
            <>
              <Group p="sm" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <ThemeIcon size={30} radius="xl" variant="filled" color="blue">
                  <Text size={11} fw={700}>
                    {getInitials(selectedCustomer?.name)}
                  </Text>
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={600}>
                    {selectedCustomer?.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {selectedCustomer?.email}
                  </Text>
                </div>
              </Group>

              <ScrollArea style={{ flex: 1 }} p="md" viewportRef={viewportRef}>
                {loadingMessages ? (
                  <Center h={200}>
                    <Loader size="sm" />
                  </Center>
                ) : (
                  <Stack gap="sm">
                    {messages.map((m) => {
                      const mine = m.senderRole === 'admin';
                      return (
                        <Group key={m._id} justify={mine ? 'flex-end' : 'flex-start'} gap={8} wrap="nowrap">
                          <div
                            style={{
                              maxWidth: '72%',
                              padding: '8px 12px',
                              borderRadius: 14,
                              background: mine
                                ? 'linear-gradient(135deg, #2f7dfb, #62a6ff)'
                                : 'rgba(255, 255, 255, 0.06)',
                              color: mine ? '#fff' : 'inherit',
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
                        </Group>
                      );
                    })}
                  </Stack>
                )}
              </ScrollArea>

              <Group p="sm" gap="xs" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }} wrap="nowrap" align="flex-end">
                <Textarea
                  placeholder="Type your reply..."
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
            </>
          )}
        </Card>
      </Group>
    </Stack>
  );
}
