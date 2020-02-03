import React from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import channelSelector, { streamChannels } from '../../selectors/channels';
import { addStream } from '../../requests/streams';
import StreamCreator from './StreamCreator';
import StreamCreators from "../TwitterBooster/Sections/StreamCreators";
import AutoCompleteSearch from '../AutoCompleteSearch';
import getSocialMediaCards from '../../config/socialmediacards';
import { Select } from 'antd';
import { Grid } from '@material-ui/core';
import AccountSelector from '../../components/AccountSelector';
import SocialMediaSelector from '../../components/SocialMediaSelector';

const { Option } = Select;

const ACCOUNT_SELECTOR_FILTERS = {
    'facebook': (account) => account.details.account_type !== 'profile'
};
class StreamInitiator extends React.Component {

    state = {
        selectedAccount: Object.entries(this.props.selectedChannel).length ?
            { label: <ProfileChannel channel={this.props.selectedChannel} />, value: this.props.selectedChannel.name, type: this.props.selectedChannel.type, id: this.props.selectedChannel.id } :
            (this.props.channels.length ?
                { label: <ProfileChannel channel={this.props.channels[0]} />, value: this.props.channels[0].name, type: this.props.channels[0].type, id: this.props.channels[0].id } : {}),
        selectedAccountId: '',
        loading: false,
        searchModal: false,
        autoCompleteSearchModal: false,
        searchTerm: "",
        
        socialMediaCards: {},
        selectedSocial: 'twitter',
        socialMediasSelectorOptions: [],
        streamIcons: [],
        streamCreator: this.props.streamCreator ? this.props.streamCreator : false
    }


    componentWillMount() {
        let socialMediaCards = getSocialMediaCards();

        this.setState({ socialMediaCards: socialMediaCards });

        this.setState({ streamIcons: socialMediaCards.twitterIcons });

        const accountSelectorOptions = this.getAccountSelectorOptions(this.state.selectedSocial);

        let selectedAccountId = accountSelectorOptions[0].id;
        
        this.setState({ selectedAccountId: selectedAccountId });


        this.props.channels.forEach(({ type, id }) => {
            // Getting the options for the socialMedia dropdown
            if (this.state.socialMediasSelectorOptions.indexOf(type) === -1) {
                this.state.socialMediasSelectorOptions.push(type);
            }
        });
    }

    submitStream = (item) => {
        this.setState(() => ({
            loading: true
        }));

        const channelId = this.state.selectedAccount.id;
        const network = this.state.selectedAccount.type;
        const selectedTab = this.props.selectedTab;
        const searchTerm = this.state.searchTerm;

        return addStream(item, channelId, selectedTab, network, searchTerm).then(() => this.props.reload()).then(() => {
            if (typeof this.props.close !== "undefined") this.props.close();
        });
    };

    handleSearchInputChange = (event) => {

        try {
            const value = event.target.value;
            this.setState(() => (
                { searchTerm: value }
            ));
        } catch (e) { }
    }

    toggleSearchModal = () => {
        this.setState(() => ({
            searchModal: !this.state.searchModal
        }), () => {
            if (!this.state.searchModal && this.state.searchTerm !== "") {
                this.submitStream({ label: "Search", value: "search", icon: "search" });
            }
        });
    };

    toggleAutoCompleteSearchModal = () => {
        this.setState(() => ({
            autoCompleteSearchModal: !this.state.autoCompleteSearchModal
        }), () => {
            if (!this.state.autoCompleteSearchModal && this.state.searchTerm !== "") {
                this.submitStream({ label: "Pages", value: "pages", icon: "flag" });
            }
        });
    };

    setAutoCompleteSelected = (value) => {
        this.setState(() => ({
            searchTerm: value
        }));
    };

    onSocialMediaChange = (value) => {
        this.setState({ selctedSocial: value });
        let socialMediaCards = this.state.socialMediaCards;

        switch (value) {
            case 'twitter':
                this.setState({ streamIcons: socialMediaCards.twitterIcons });
                break;
            case 'facebook':
                this.setState({ streamIcons: socialMediaCards.facebookIcons });
                break;
            case 'linkedin':
                this.setState({ streamIcons: socialMediaCards.linkedinIcons });
                break;
            default:
                break;
        }
    };

    onAccountChange = (value) => {        
        this.setState({ selectedAccountId: value });
        let selectedAccount = this.props.channels.find((item) => item.id === value);
        if (selectedAccount)
            this.setState({selectedAccount: selectedAccount});
    };

    getAccountSelectorOptions = (selectedSocial) => {
        const { channels } = this.props;
        const socialMediaFilter = ACCOUNT_SELECTOR_FILTERS[selectedSocial];
        let options = channels.filter((account => account.type === selectedSocial));
        if (socialMediaFilter) {
            options = options.filter(socialMediaFilter);
        }
        return options;
    };

    onClickCreator = (item) => {        
        let input = item;
        this.toggleStreamCreator();
        this.submitStream(input);
    }

    toggleStreamCreator = () => {
        this.setState(() => ({
            streamCreator: !this.state.streamCreator
        }));
    };

    render() {
        const { selectedTab, reload, channels } = this.props;
        const { selectedSocial, selectedAccountId, selectedAccount, socialMediasSelectorOptions } = this.state;
        return (
            <div>

                <Modal isOpen={!!this.state.searchModal} ariaHideApp={false} className="stream-type-modal search-modal">
                    <div>
                        <input type="text" onChange={e => this.handleSearchInputChange(e)} value={this.state.searchTerm} placeholder="Example: coca cola or #fashion" />
                        <button onClick={this.toggleSearchModal} className="publish-btn-group gradient-background-teal-blue link-cursor">Done</button>
                    </div>
                </Modal>

                <Modal isOpen={!!this.state.autoCompleteSearchModal} ariaHideApp={false} className="stream-type-modal search-modal">
                    <div>
                        <AutoCompleteSearch placeholder="Type a page name..." channelId={selectedAccount.id} setSelected={this.setAutoCompleteSelected} />
                        <button onClick={this.toggleAutoCompleteSearchModal} className="publish-btn-group autocomplete-done gradient-background-teal-blue link-cursor">Done</button>
                    </div>
                </Modal>

                <div className="monitor-label">
                    <span className="monitor-spacing">Social Network</span>
                    <div className="monitor-right-spacing">
                        <SocialMediaSelector
                            socialMedias={socialMediasSelectorOptions}
                            value={selectedSocial}
                            onChange={this.onSocialMediaChange}
                        />
                    </div>
                    <span className="monitor-spacing">Users</span>
                    <div className="monitor-right-spacing">
                        <AccountSelector
                            onChange={this.onAccountChange}
                            value={selectedAccountId}
                            accounts={this.getAccountSelectorOptions(selectedSocial)}
                        />
                    </div>
                </div>

                <Grid container>
                    <Grid item md={9}>
                        <StreamCreators
                            creators={this.state.streamIcons}
                            onClickCreator={this.onClickCreator}
                        />
                    </Grid>
                </Grid>
            </div>

        )
    }
}

export const StreamFeedItemPlaceholder = () => (
    <div>
        <div className="profile-placeholder">
            <div className="profile-image-placeholder"></div>
            <div className="profile-text-placeholder">
                <div></div>
                <div></div>
            </div>
        </div>

        <div className="text-placeholder">
            <div></div>
            <div></div>
            <div></div>
        </div>

        <div className="iconx-placeholder">
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
);

export class StreamMaker extends React.Component {
    state = {
        streamCreator: this.props.streamCreator ? this.props.streamCreator : false
    }

    toggleStreamCreator = () => {
        this.setState(() => ({
            streamCreator: !this.state.streamCreator
        }));
    };

    render() {

        const {
            title,
            description,
            icon,
            intro = false,
            onItemClick,
            item,
            selectedTab,
            reload,
            channels,
            streamSize = false,
            toggle,
            minimize
        } = this.props;

        const { streamCreator } = this.state;
        return (
            <div className={`stream-maker ${streamSize && 'stream-size'}`}>
                <h3 className={`stream-title`}>

                    <span className="text-cursor">{!!icon && <img src={`/images/${icon}.svg`} />} {title} </span>
                    {!!minimize && <i className="fa fa-minus pull-right link-cursor" onClick={toggle}></i>}

                </h3>

                {!streamCreator ?
                    <div className="stream-feed">
                        <div className="stream-feed-container">
                            <div className="stream-feed-container-text">
                                {description}
                            </div>
                            <div className="txt-center">
                                {item.value === "browse" || channels.length > 1 ?
                                    <button className="magento-btn mb25" onClick={() => this.toggleStreamCreator()}>Get Started</button> :
                                    <button className="magento-btn mb25" onClick={() => onItemClick(item)}>Get Started</button>
                                }
                            </div>
                        </div>

                        <div className={`stream-feed-container ${intro && 'blur'}`}>
                            <StreamFeedItemPlaceholder />
                        </div>

                        <div className={`stream-feed-container ${intro && 'blur'}`}>
                            <StreamFeedItemPlaceholder />
                        </div>

                        <div className={`stream-feed-container ${intro && 'blur'}`}>
                            <StreamFeedItemPlaceholder />
                        </div>

                        <div className={`stream-feed-container ${intro && 'blur'}`}>
                            <StreamFeedItemPlaceholder />
                        </div>

                        {!!intro && <div className="stream-intro">
                            <img src="/images/hello_bubble_smiley.svg" />
                            <h3>Welcome to Streams: </h3>
                            <h5>People are talking, make sure your listening.</h5>
                            <p>A great way to manage mentions and monitor keywords and hashtags.</p>
                        </div>}
                    </div>
                    :
                    <div className="stream-feed stream-creator-feed scrollbar">
                        {item.value === "browse" ?
                            <StreamCreator selectedTab={selectedTab} reload={reload} verticalDisplay={true} />
                            :
                            <StreamCreator selectedTab={selectedTab} reload={reload} verticalDisplay={true} defaultItem={item} />
                        }
                    </div>
                }
            </div>
        );
    }
}

const ProfileChannel = ({ channel }) => (
    <div className="channel-container">
        <div className="profile-info pull-right">
            <span className="pull-left profile-img-container">
                <img src={channel.avatar} />
                <i className={`fa fa-${channel.type} ${channel.type}_bg smallIcon`}></i>
            </span>
            <div className="pull-left"><p className="profile-name" title={channel.name}>{channel.name}</p>
                <p className="profile-username">{channel.username !== null ? "@" + channel.username : ""}</p>
            </div>
        </div>
    </div>
);

const mapStateToProps = (state) => {
    const channels = streamChannels(state.channels.list);
    const selectedChannel = channelSelector(channels, { selected: 1 });

    return {
        channels,
        selectedChannel: selectedChannel.length ? selectedChannel[0] : {},
    }
}

export default connect(mapStateToProps)(StreamInitiator);