import { Pressable, Text, type PressableProps } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
}

export function Button({ title, disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`items-center rounded-xl bg-primary px-5 py-3 active:opacity-80 ${
        disabled ? 'opacity-50' : ''
      }`}
      {...props}
    >
      <Text className="text-base font-semibold text-primary-foreground">
        {title}
      </Text>
    </Pressable>
  );
}
