import { useState } from "react";
import { Check, Mail, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { Spinner } from "../components/ui/Spinner";
import { Skeleton } from "../components/ui/Skeleton";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Tooltip } from "../components/ui/Tooltip";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Grid } from "../components/layout/Grid";
import { Flex } from "../components/layout/Flex";
import styles from "./Preview.module.css";

export default function Preview() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const { toast } = useToast();

  const sampleOptions = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <Container maxWidth="xl" padding="lg">
      <Stack gap="xl">
        <header className={styles.header}>
          <h1 className="page-title">Design System Preview</h1>
          <p className="page-subtitle">
            Visual reference for every primitive and layout helper. Updated as the system evolves.
          </p>
        </header>

        <Section title="Button" subtitle="5 variants × 3 sizes + loading + icon support">
          <Stack gap="md">
            <Row label="Variants (md)">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="icon" aria-label="Edit">
                <Pencil size={14} />
              </Button>
            </Row>
            <Row label="Sizes">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Row>
            <Row label="With icons">
              <Button leftIcon={<Plus size={14} />}>Add</Button>
              <Button variant="secondary" rightIcon={<Check size={14} />}>
                Done
              </Button>
              <Button variant="danger" leftIcon={<Trash2 size={14} />}>
                Delete
              </Button>
            </Row>
            <Row label="States">
              <Button isLoading>Saving…</Button>
              <Button disabled>Disabled</Button>
            </Row>
          </Stack>
        </Section>

        <Section title="Input" subtitle="7 variants, password eye, label/error/hint">
          <Grid cols={2} gap="md">
            <Input label="Text" placeholder="John Doe" />
            <Input variant="email" label="Email" leftIcon={<Mail size={14} />} placeholder="you@example.com" />
            <Input variant="password" label="Password" placeholder="••••••••" />
            <Input variant="search" label="Search" leftIcon={<Search size={14} />} placeholder="Search…" />
            <Input variant="number" label="Quantity" placeholder="0" />
            <Input variant="date" label="Date" />
            <Input label="With error" error="This field is required" />
            <Input label="With hint" hint="At least 8 characters" />
            <Input label="Disabled" disabled value="Read-only" />
          </Grid>
        </Section>

        <Section title="Textarea">
          <Grid cols={2} gap="md">
            <Textarea label="Notes" placeholder="Type your notes…" />
            <Textarea label="With error" error="Notes are required" rows={3} />
          </Grid>
        </Section>

        <Section title="Select">
          <Grid cols={2} gap="md">
            <Select label="Status" options={sampleOptions} placeholder="Choose status" />
            <Select label="With error" options={sampleOptions} error="Pick one" />
          </Grid>
        </Section>

        <Section title="Modal" subtitle="dialog / drawer / alert variants">
          <Row label="Open">
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              Open dialog
            </Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Open drawer
            </Button>
            <Button variant="danger" onClick={() => setAlertOpen(true)}>
              Open alert
            </Button>
          </Row>
        </Section>

        <Section title="Toast">
          <Row label="Trigger">
            <Button onClick={() => toast("Saved successfully", { type: "success", title: "Success" })}>
              Success toast
            </Button>
            <Button variant="secondary" onClick={() => toast("Information note", { type: "info" })}>
              Info toast
            </Button>
            <Button variant="secondary" onClick={() => toast("Heads up", { type: "warning", title: "Warning" })}>
              Warning toast
            </Button>
            <Button variant="danger" onClick={() => toast("Something failed", { type: "error", title: "Error" })}>
              Error toast
            </Button>
          </Row>
        </Section>

        <Section title="Spinner">
          <Row label="Sizes / tones">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner tone="neutral" />
          </Row>
        </Section>

        <Section title="Skeleton">
          <Stack gap="md">
            <Skeleton variant="text" lines={3} />
            <Flex gap="md" align="center">
              <Skeleton variant="circle" />
              <Skeleton variant="rect" width="60%" height={20} />
            </Flex>
          </Stack>
        </Section>

        <Section title="Badge" subtitle="6 variants × 2 sizes">
          <Stack gap="md">
            <Row label="Variants (sm)">
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="count">12</Badge>
            </Row>
            <Row label="Size md">
              <Badge variant="success" size="md">Success</Badge>
              <Badge variant="info" size="md" leftIcon={<Check size={12} />}>Verified</Badge>
            </Row>
          </Stack>
        </Section>

        <Section title="Avatar" subtitle="5 sizes, circle/square, initials fallback">
          <Row label="Sizes">
            <Avatar size="xs" name="Oseid Abood" />
            <Avatar size="sm" name="Oseid Abood" />
            <Avatar size="md" name="Oseid Abood" />
            <Avatar size="lg" name="Oseid Abood" />
            <Avatar size="xl" name="Oseid Abood" />
            <Avatar name="Anna B" tone="neutral" />
            <Avatar shape="square" name="Square" />
            <Avatar name="" />
          </Row>
        </Section>

        <Section title="Tooltip">
          <Row label="Hover/focus">
            <Tooltip content="Top tooltip">
              <Button variant="secondary">Top</Button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" side="bottom">
              <Button variant="secondary">Bottom</Button>
            </Tooltip>
            <Tooltip content="Right tooltip" side="right">
              <Button variant="secondary">Right</Button>
            </Tooltip>
            <Tooltip content="Left tooltip" side="left">
              <Button variant="secondary">Left</Button>
            </Tooltip>
          </Row>
        </Section>

        <Section title="Layout helpers">
          <Stack gap="md">
            <div className={styles.layoutDemo}>
              <strong>Grid cols=3</strong>
              <Grid cols={3} gap="sm">
                <Tile>1</Tile><Tile>2</Tile><Tile>3</Tile>
              </Grid>
            </div>
            <div className={styles.layoutDemo}>
              <strong>Stack horizontal</strong>
              <Stack direction="horizontal" gap="sm">
                <Tile>A</Tile><Tile>B</Tile><Tile>C</Tile>
              </Stack>
            </div>
            <div className={styles.layoutDemo}>
              <strong>Flex with grow</strong>
              <Flex gap="sm">
                <Tile>left</Tile>
                <div style={{ flex: 1 }} />
                <Tile>right</Tile>
              </Flex>
            </div>
          </Stack>
        </Section>
      </Stack>

      <Modal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Sample dialog"
        description="Centered modal with footer actions."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setDialogOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <Stack gap="sm">
          <Input label="Your name" placeholder="Oseid" />
          <Textarea label="Comments" rows={3} />
        </Stack>
      </Modal>

      <Modal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="drawer"
        title="Drawer"
        description="Right-anchored slide-over."
      >
        <Stack gap="sm">
          <p>Drawer body content goes here.</p>
          <Button variant="secondary" onClick={() => setDrawerOpen(false)} leftIcon={<X size={14} />}>
            Close
          </Button>
        </Stack>
      </Modal>

      <Modal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        variant="alert"
        title="Delete this item?"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAlertOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setAlertOpen(false)}>
              Delete
            </Button>
          </>
        }
      >
        <p>Confirm deletion. This is permanent.</p>
      </Modal>
    </Container>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.rowItems}>{children}</div>
    </div>
  );
}

function Tile({ children }: { children: React.ReactNode }) {
  return <div className={styles.tile}>{children}</div>;
}
