import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { background, cornerRadius, font, foregroundStyle, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import { WIDGET_COPY } from '../src/content/widgetCopy';

type PebbleWidgetProps = {
  hasWaitingPebble?: boolean;
};

const PebbleWidget = (props: PebbleWidgetProps) => {
  'widget';

  const isWaiting = props.hasWaitingPebble === true;

  return (
    <VStack
      alignment="center"
      spacing={10}
      modifiers={[
        background(isWaiting ? '#E8E2D8' : '#EEF0E9'),
        cornerRadius(22),
        padding({ all: 18 }),
        widgetURL('pebble://shore'),
      ]}
    >
      <Image color={isWaiting ? '#A98368' : '#839487'} size={42} systemName="circle.fill" />
      <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle('#46483F')]}>
        {isWaiting ? WIDGET_COPY.waiting : WIDGET_COPY.quiet}
      </Text>
    </VStack>
  );
};

export default createWidget<PebbleWidgetProps>('PebbleWidget', PebbleWidget);
