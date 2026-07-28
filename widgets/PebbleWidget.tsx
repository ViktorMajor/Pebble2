import { Image, Text, VStack } from '@expo/ui/swift-ui';
import { background, cornerRadius, font, foregroundStyle, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import { WIDGET_COPY } from '../src/content/widgetCopy';

type PebbleWidgetProps = {
  hasWaitingPebble?: boolean;
  locale?: 'en' | 'hu';
};

const PebbleWidget = (props: PebbleWidgetProps) => {
  'widget';

  const isWaiting = props.hasWaitingPebble === true;
  const copy = WIDGET_COPY[props.locale === 'hu' ? 'hu' : 'en'];

  return (
    <VStack
      alignment="center"
      spacing={10}
      modifiers={[
        background('#1B2026'),
        cornerRadius(22),
        padding({ all: 18 }),
        widgetURL('pebble://bowl'),
      ]}
    >
      <Image color={isWaiting ? '#A28B73' : '#62676A'} size={42} systemName="circle.fill" />
      <Text modifiers={[font({ size: 14, weight: 'medium' }), foregroundStyle('#EEEAE2')]}>
        {isWaiting ? copy.waiting : copy.quiet}
      </Text>
    </VStack>
  );
};

export default createWidget<PebbleWidgetProps>('PebbleWidget', PebbleWidget);
