# PopupMessage Component Usage

The `PopupMessage` component is a reusable popup dialog for showing success, error, warning, and info messages.

## Props

```typescript
interface PopupMessageProps {
  isOpen: boolean;                    // Controls popup visibility
  onClose: () => void;               // Function called when popup is closed
  type: "success" | "error" | "warning" | "info";  // Message type
  title: string;                     // Popup title
  message: string;                   // Popup message
  primaryButton?: {                  // Optional primary button
    text: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  secondaryButton?: {                // Optional secondary button
    text: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  showCloseButton?: boolean;         // Show close button (default: true)
}
```

## Examples

### Basic Success Message
```tsx
const [popup, setPopup] = useState({
  isOpen: false,
  type: "success" as const,
  title: "",
  message: "",
});

<PopupMessage
  isOpen={popup.isOpen}
  onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))}
  type={popup.type}
  title={popup.title}
  message={popup.message}
  primaryButton={{
    text: "OK",
    onClick: () => setPopup(prev => ({ ...prev, isOpen: false })),
  }}
  showCloseButton={false}
/>
```

### Error Message with Custom Actions
```tsx
<PopupMessage
  isOpen={true}
  onClose={handleClose}
  type="error"
  title="Operation Failed"
  message="Something went wrong. Please try again."
  primaryButton={{
    text: "Retry",
    onClick: handleRetry,
    variant: "destructive",
  }}
  secondaryButton={{
    text: "Cancel",
    onClick: handleClose,
    variant: "outline",
  }}
/>
```

### Info Message with Navigation
```tsx
<PopupMessage
  isOpen={true}
  onClose={handleClose}
  type="info"
  title="Information"
  message="Your data has been saved successfully."
  primaryButton={{
    text: "View Details",
    onClick: () => router.push("/details"),
  }}
  secondaryButton={{
    text: "Close",
    onClick: handleClose,
  }}
/>
```

## Features

- **Icons**: Automatically shows appropriate icons based on message type
- **Colors**: Title color changes based on message type
- **Responsive**: Works on mobile and desktop
- **Customizable**: Flexible button configuration
- **Accessible**: Uses proper ARIA attributes and keyboard navigation

## Message Types

- **Success**: Green checkmark icon, green title
- **Error**: Red X icon, red title  
- **Warning**: Yellow alert icon, yellow title
- **Info**: Blue info icon, blue title 