import { FaBrain } from 'react-icons/fa';
import { AiFillThunderbolt } from 'react-icons/ai';
import { BaseProps } from '../@types/common';
import { Model } from '../@types/conversation';
import Button from './Button';

type Props = BaseProps & {
  postedModel: Model | null;
  model: Model;
  setModel: (model: Model) => void;
};

const SwitchBedrockModel: React.FC<Props> = (props) => {
  const buttonClass =
    'flex-1 w-40 flex items-center rounded-lg p-2 justify-center';

  return props.postedModel ? (
    <div className="text-sm text-gray-500">model: {props.postedModel}</div>
  ) : (
    <div className="flex justify-center gap-2 rounded-lg border bg-gray-200 p-1 text-sm">
      <Button
        className={`${buttonClass} ${
          props.model === 'claude-instant-v1'
            ? 'bg-aws-squid-ink/100 text-white'
            : 'bg-aws-paper text-gray-500'
        }`}
        icon={<AiFillThunderbolt />}
        onClick={() => props.setModel('claude-instant-v1')}
        children={<span>Claude Instant</span>}></Button>
      <Button
        className={`${buttonClass} ${
          props.model === 'claude-v2'
            ? 'bg-aws-squid-ink/100 text-white'
            : 'bg-aws-paper text-gray-500'
        }`}
        icon={<FaBrain />}
        onClick={() => props.setModel('claude-v2')}
        children={<span>Claude v2</span>}></Button>
    </div>
  );
};

export default SwitchBedrockModel;
